// image-translator-new/src/types/index.ts
export interface AreaStyle {
  fontSize: number;
  lineHeight?: number; 
  backgroundColor: string;
  color: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  fontFamily: string;
  textDecoration: 'none' | 'underline' | 'line-through' | 'overline'; // Added 'overline'
  textAlign: 'left' | 'center' | 'right' | 'justify';
}

export interface Area {
  id: string;
  bbox: [number, number, number, number];
  sourceString: string; 
  translatedString: string;
  style: AreaStyle;
}