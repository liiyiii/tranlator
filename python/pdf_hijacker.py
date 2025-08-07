import fitz  # PyMuPDF
import json
from typing import List, Dict, Any
from translate_service import OllamaTranslator

class PDFHijacker:
    """PDF注释修改工具"""
    
    def __init__(self, translator: OllamaTranslator = None):
        self.translator = translator or OllamaTranslator()
    
    def hijack_annotations(
        self,
        pdf_path: str,
        translated_blocks: List[Dict[str, Any]],
        output_path: str = None
    ) -> None:
        """
        修改PDF中的注释文本
        :param pdf_path: PDF文件路径
        :param translated_blocks: 翻译后的文本块列表
        :param output_path: 输出路径（None则覆盖原文件）
        """
        doc = fitz.open(pdf_path)
        
        for page in doc:
            for i, annot in enumerate(page.annots()):
                if i < len(translated_blocks):
                    annot.set_info(content=translated_blocks[i]['translated'])
        
        # 根据是否指定了输出路径来决定保存方式
        if output_path:
            # 如果指定了新的输出路径，则不能使用增量保存
            doc.save(output_path)
        else:
            # 如果不指定输出路径，则覆盖原文件，可以使用增量保存
            doc.save(pdf_path, incremental=True)
            
        doc.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf_path", help="PDF文件路径")
    parser.add_argument("json_path", help="翻译结果JSON文件路径")
    parser.add_argument("--output", help="输出PDF路径（可选）")
    args = parser.parse_args()
    
    with open(args.json_path, 'r', encoding='utf-8') as f:
        blocks = json.load(f)
    
    hijacker = PDFHijacker()
    hijacker.hijack_annotations(args.pdf_path, blocks, args.output)