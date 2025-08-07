# python/full_ocr.py
import sys
import json
import io
import os
import uuid
import subprocess
from pathlib import Path
import fitz

# 强制设置编码环境
os.environ['PYTHONIOENCODING'] = 'utf-8'
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
if hasattr(sys.stderr, 'buffer'):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 添加项目根目录到Python路径
sys.path.append(str(Path(__file__).parent.parent))

def main():
    try:
        # 解析命令行参数
        if len(sys.argv) != 2:
            raise ValueError("Usage: python full_ocr.py <image_path>")
        
        image_path = sys.argv[1]
        
        # 调用你原有的OCR脚本生成PDF和字体大小 (from-ocr-image-merge.py)
        pdf_output = "temp_ocr_result.pdf"
        font_size_file = "font_size.pkl"
        bg_image_file = "background.png"
        
        # 执行你的OCR脚本
        ocr_script_path = Path(__file__).parent / "from-ocr-image-merge.py"
        result = subprocess.run([
            sys.executable, 
            str(ocr_script_path), 
            image_path, 
            pdf_output
        ], capture_output=True, text=True, encoding='utf-8')
        
        if result.returncode != 0:
            raise Exception(f"OCR script failed: {result.stderr}")
        
        # 调用你的翻译脚本处理PDF
        translated_json = "temp_translated.json"
        translate_script_path = Path(__file__).parent / "translate_service.py"
        result = subprocess.run([
            sys.executable,
            str(translate_script_path),
            pdf_output,
            translated_json,
            "zh"  # 目标语言
        ], capture_output=True, text=True, encoding='utf-8')
        
        if result.returncode != 0:
            raise Exception(f"Translation script failed: {result.stderr}")
        
        # 读取翻译结果
        with open(translated_json, 'r', encoding='utf-8') as f:
            blocks = json.load(f)
        
        # 构建输出数据
        ocr_data = []
        bboxes = []
        
        for i, block in enumerate(blocks):
            bbox = block.get('bbox', [0, 0, 0, 0])
            bboxes.append(bbox)
            
            # 处理颜色信息 - 优先使用脚本返回的颜色，否则使用颜色估计
            fgcolor = block.get('fgcolor')
            bgcolor = block.get('bgcolor')
            
            # 如果脚本没有返回颜色，调用你的颜色估计功能
            if fgcolor is None or bgcolor is None:
                try:
                    # 调用你原有脚本中的颜色估计功能
                    from to_ocr_pptx import ColorEstimator
                    from PIL import Image
                    
                    # 读取背景图像并估计颜色
                    if os.path.exists(bg_image_file):
                        image = Image.open(bg_image_file)
                        color_estimator = ColorEstimator()
                        x1, y1, x2, y2 = [coord * 2.0 for coord in bbox]  # 2倍缩放
                        if 0 <= x1 < x2 and 0 <= y1 < y2:
                            try:
                                crop = image.crop((x1, y1, x2, y2))
                                estimated_fg, estimated_bg = color_estimator.run(crop)
                                fgcolor = fgcolor or estimated_fg
                                bgcolor = bgcolor or estimated_bg
                            except:
                                pass
                except Exception as e:
                    print(f"Color estimation warning: {e}", file=sys.stderr)
            
            # 默认颜色值
            fgcolor = fgcolor or (0, 0, 0)
            bgcolor = bgcolor or (255, 255, 255)
            
            # RGBA转十六进制
            def rgba_to_hex(rgba_tuple):
                if not rgba_tuple:
                    return "#000000"
                try:
                    if len(rgba_tuple) >= 3:
                        r, g, b = rgba_tuple[:3]
                        return f"#{int(r):02x}{int(g):02x}{int(b):02x}"
                    else:
                        return "#000000"
                except:
                    return "#000000"
            
            # 优先使用block中已有的字体大小信息（如果你的脚本已经提供了）
            font_size = block.get('font_size')  # 检查是否有现成的字体大小
            
            # 如果没有现成的字体大小，使用bbox估算
            if font_size is None:
                if len(bbox) == 4:
                    height = abs(bbox[3] - bbox[1])
                    # 使用更精确的字体大小估算公式
                    font_size = int(height * 0.8)  # 调整比例因子
                    font_size = max(8, min(100, font_size))  # 限制范围
                else:
                    font_size = 16  # 默认值
            
            ocr_block = {
                "id": str(uuid.uuid4()),
                "bbox": [int(coord) for coord in bbox],
                "text": block.get('text', ''),
                "translatedText": block.get('translated', ''),
                "color": rgba_to_hex(fgcolor),  # 前景色(字体颜色)
                "backgroundColor": rgba_to_hex(bgcolor),  # 背景色
                "fontSize": int(font_size)  # 确保是整数类型
            }
            ocr_data.append(ocr_block)
        
        # 估算全局字体大小 - 调用你原有脚本中的功能
        estimated_font_size = 16
        if os.path.exists(font_size_file):
            try:
                from helper.fileio import load_pkl
                font_size = load_pkl(font_size_file)
                if font_size:
                    # 转换PDF PPI到PPT PPI
                    estimated_font_size = int(font_size / 72 * 96)
            except:
                pass
        elif bboxes:
            # 基于所有文本块的平均高度估算
            heights = [abs(bbox[3] - bbox[1]) for bbox in bboxes if len(bbox) == 4]
            if heights:
                avg_height = sum(heights) / len(heights)
                estimated_font_size = int(avg_height * 0.7)  # 调整比例因子
        
        # 清理临时文件
        temp_files = [pdf_output, translated_json, font_size_file, bg_image_file]
        for temp_file in temp_files:
            if os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except:
                    pass
        
        # 输出结果
        output = {
            "ocrData": ocr_data,
            "estimatedFontSize": int(estimated_font_size),  # 确保是整数
            "error": None
        }
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        output = {
            "ocrData": [],
            "estimatedFontSize": 16,
            "error": str(e)
        }
    
    # 输出JSON到stdout，确保编码正确
    print(json.dumps(output, ensure_ascii=False, separators=(',', ':')))

if __name__ == "__main__":
    main()