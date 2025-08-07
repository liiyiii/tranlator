# python/partial_ocr.py
import sys
import json
import io
import os
import subprocess
import uuid
from pathlib import Path
import fitz
from PIL import Image

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
        if len(sys.argv) != 4 or sys.argv[2] != "--bbox":
            raise ValueError("Usage: python partial_ocr.py <image_path> --bbox <x1,y1,x2,y2>")
        
        image_path = sys.argv[1]
        bbox_str = sys.argv[3]
        
        # 解析bbox坐标
        bbox_coords = list(map(int, bbox_str.split(',')))
        if len(bbox_coords) != 4:
            raise ValueError("Invalid bbox format")
        
        # 裁剪图像
        def crop_image_to_temp(image_path, bbox):
            """裁剪图像并保存为临时文件"""
            try:
                # 打开原始图像
                doc = fitz.open(image_path)
                page = doc[0]
                
                # 裁剪区域
                crop_rect = fitz.Rect(bbox[0], bbox[1], bbox[2], bbox[3])
                
                # 获取裁剪后的图像
                mat = fitz.Matrix(2, 2)  # 2倍缩放提高识别精度
                pix = page.get_pixmap(clip=crop_rect, matrix=mat)
                
                # 保存为临时文件
                temp_cropped = "temp_cropped_region.png"
                pix.save(temp_cropped)
                
                doc.close()
                return temp_cropped
            except Exception as e:
                raise Exception(f"Failed to crop image: {e}")
        
        cropped_image_path = crop_image_to_temp(image_path, bbox_coords)
        
        # 调用全图OCR脚本处理裁剪后的图像 (from-ocr-image-merge.py)
        pdf_output = "temp_partial_ocr.pdf"
        ocr_script_path = Path(__file__).parent / "from-ocr-image-merge.py"
        result = subprocess.run([
            sys.executable,
            str(ocr_script_path),
            cropped_image_path,
            pdf_output
        ], capture_output=True, text=True, encoding='utf-8')
        
        if result.returncode != 0:
            raise Exception(f"OCR script failed: {result.stderr}")
        
        # 调用翻译脚本
        translated_json = "temp_partial_translated.json"
        translate_script_path = Path(__file__).parent / "translate_service.py"
        result = subprocess.run([
            sys.executable,
            str(translate_script_path),
            pdf_output,
            translated_json,
            "zh"
        ], capture_output=True, text=True, encoding='utf-8')
        
        if result.returncode != 0:
            raise Exception(f"Translation script failed: {result.stderr}")
        
        # 读取结果
        with open(translated_json, 'r', encoding='utf-8') as f:
            blocks = json.load(f)
        
        if not blocks:
            raise Exception("No text detected in the region")
        
        # 获取第一个文本块
        block = blocks[0]
        bbox = block.get('bbox', [0, 0, 0, 0])
        
        # 优先使用block中已有的字体大小信息
        font_size = block.get('font_size')
        
        # 如果没有现成的字体大小，使用bbox估算
        if font_size is None:
            if len(bbox) == 4:
                height = abs(bbox[3] - bbox[1])
                # 使用更精确的字体大小估算公式
                font_size = int(height * 0.8)  # 调整比例因子
                font_size = max(8, min(100, font_size))  # 限制范围
            else:
                font_size = 16  # 默认值
        
        # 处理颜色信息 - 调用你原有脚本的颜色估计功能
        fgcolor = block.get('fgcolor', (0, 0, 0))
        bgcolor = block.get('bgcolor', (255, 255, 255))
        
        # 如果没有颜色信息，调用颜色估计
        if 'fgcolor' not in block or 'bgcolor' not in block:
            try:
                from to_ocr_pptx import ColorEstimator
                image = Image.open(cropped_image_path)
                color_estimator = ColorEstimator()
                # 估计整个裁剪区域的颜色
                estimated_fg, estimated_bg = color_estimator.run(image)
                fgcolor = fgcolor or estimated_fg
                bgcolor = bgcolor or estimated_bg
            except Exception as e:
                print(f"Color estimation warning: {e}", file=sys.stderr)
        
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
        
        new_block = {
            "id": str(uuid.uuid4()),
            "bbox": [int(coord) for coord in bbox],  # 相对于裁剪区域的坐标
            "text": block.get('text', ''),
            "translatedText": block.get('translated', ''),
            "color": rgba_to_hex(fgcolor),  # 前景色(字体颜色)
            "backgroundColor": rgba_to_hex(bgcolor),  # 背景色
            "fontSize": int(font_size)  # 确保是整数类型
        }
        
        # 清理临时文件
        temp_files = [cropped_image_path, pdf_output, translated_json]
        for temp_file in temp_files:
            if os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except:
                    pass
        
        # 输出结果
        output = {
            "newBlock": new_block,
            "error": None
        }
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        output = {
            "newBlock": {},
            "error": str(e)
        }
    
    # 输出JSON到stdout，确保编码正确
    print(json.dumps(output, ensure_ascii=False, separators=(',', ':')))

if __name__ == "__main__":
    main()