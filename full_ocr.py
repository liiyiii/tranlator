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

def rgba_to_hex(rgba_tuple):
    """将RGBA元组转换为十六进制颜色字符串"""
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

def estimate_colors_for_blocks(image_path, blocks, scale=2.0):
    """调用你原有脚本中的颜色估计功能"""
    try:
        # 导入你原有的颜色估计器 (to-ocr-pptx.py)
        from to_ocr_pptx import ColorEstimator
        from PIL import Image
        
        # 读取图像
        image = Image.open(image_path)
        color_estimator = ColorEstimator()
        
        fgcolors = []
        bgcolors = []
        
        for block in blocks:
            bbox = block.get('bbox', [0, 0, 0, 0])
            x1, y1, x2, y2 = [coord * scale for coord in bbox]
            
            # 裁剪文本块区域
            if 0 <= x1 < x2 and 0 <= y1 < y2:
                try:
                    crop = image.crop((x1, y1, x2, y2))
                    fg, bg = color_estimator.run(crop)
                    fgcolors.append(fg)
                    bgcolors.append(bg)
                except:
                    # 如果裁剪失败，使用默认颜色
                    fgcolors.append((0, 0, 0))
                    bgcolors.append((255, 255, 255))
            else:
                fgcolors.append((0, 0, 0))
                bgcolors.append((255, 255, 255))
        
        return fgcolors, bgcolors
    except Exception as e:
        print(f"Color estimation failed: {e}", file=sys.stderr)
        # 返回默认颜色
        default_fg = [(0, 0, 0)] * len(blocks)
        default_bg = [(255, 255, 255)] * len(blocks)
        return default_fg, default_bg

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
        
        # 调用你原有脚本的颜色估计功能
        fgcolors, bgcolors = estimate_colors_for_blocks(image_path, blocks)
        
        # 构建输出数据
        ocr_data = []
        bboxes = []
        
        for i, block in enumerate(blocks):
            bbox = block.get('bbox', [0, 0, 0, 0])
            bboxes.append(bbox)
            
            # 使用你估计的颜色
            fgcolor = fgcolors[i] if i < len(fgcolors) else (0, 0, 0)
            bgcolor = bgcolors[i] if i < len(bgcolors) else (255, 255, 255)
            
            ocr_block = {
                "id": str(uuid.uuid4()),
                "bbox": [int(coord) for coord in bbox],
                "text": block.get('text', ''),
                "translatedText": block.get('translated', ''),
                "color": rgba_to_hex(fgcolor),  # 前景色(字体颜色)
                "backgroundColor": rgba_to_hex(bgcolor)  # 背景色
            }
            ocr_data.append(ocr_block)
        
        # 估算字体大小 - 调用你原有脚本中的功能
        estimated_font_size = 16
        if os.path.exists(font_size_file):
            try:
                from helper.fileio import load_pkl
                font_size = load_pkl(font_size_file)
                if font_size:
                    estimated_font_size = int(font_size / 72 * 96)  # PDF PPI=72, PPT PPI=96
            except:
                pass
        
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
            "estimatedFontSize": estimated_font_size,
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