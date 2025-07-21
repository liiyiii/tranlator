// image-translator-new/src/components/ImageCanvas.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { useEditorContext } from '@/contexts/EditorContext';
import { Area } from '@/types';

interface ImageCanvasProps {
  onNewAreaSelect: (bbox: [number, number, number, number]) => void;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({ onNewAreaSelect }) => {
  const { 
    areas, setAreas, 
    selectedAreaId, setSelectedAreaId, 
    backgroundImageUrl, 
    setFabricCanvasInstance
  } = useEditorContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [displaySize, setDisplaySize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: displaySize.width,
        height: displaySize.height,
        backgroundColor: '#18181b',
        selectionColor: 'rgba(99, 102, 241, 0.3)',
        selectionBorderColor: '#8b5cf6',
        selectionLineWidth: 2,
        selectionDashArray: [6, 3],
        stopContextMenu: true,
      });
      fabricCanvasRef.current = canvas;
      setFabricCanvasInstance(canvas);

      canvas.on('mouse:wheel', function (opt: fabric.IEvent<WheelEvent>) {
        const delta = opt.e.deltaY;
        let zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 20) zoom = 20;
        if (zoom < 0.1) zoom = 0.1;
        const point = new fabric.Point(opt.e.offsetX, opt.e.offsetY);
        canvas.zoomToPoint(point, zoom);
        opt.e.preventDefault();
        opt.e.stopPropagation();
      });

      let isPanning = false;
      let isDrawingSelection = false;
      let selectionRect: fabric.Rect | null = null;
      let startX: number, startY: number;
      let lastPosX: number, lastPosY: number;

      canvas.on('mouse:down', function (opt: fabric.IEvent<MouseEvent>) {
        const evt = opt.e;
        const target = opt.target;
        
        if (evt.altKey === true || (target === null || target === undefined && !isDrawingSelection)) { 
          isPanning = true;
          canvas.selection = false; 
          lastPosX = evt.clientX;
          lastPosY = evt.clientY;
        } else if (target === null || target === undefined) {
          isDrawingSelection = true;
          const pointer = canvas.getPointer(evt);
          startX = pointer.x;
          startY = pointer.y;
          selectionRect = new fabric.Rect({
            left: startX,
            top: startY,
            width: 0,
            height: 0,
            fill: 'rgba(139, 92, 246, 0.2)',
            stroke: '#8b5cf6',
            strokeWidth: 1,
            strokeDashArray: [4, 2],
            selectable: false,
            evented: false,
          });
          canvas.add(selectionRect);
          canvas.requestRenderAll();
        } else {
          canvas.selection = true; 
        }
      });

      canvas.on('mouse:move', function (opt: fabric.IEvent<MouseEvent>) {
        if (isPanning && canvas.viewportTransform) {
          const e = opt.e;
          const vpt = canvas.viewportTransform;
          vpt[4] += e.clientX - lastPosX;
          vpt[5] += e.clientY - lastPosY;
          canvas.requestRenderAll();
          lastPosX = e.clientX;
          lastPosY = e.clientY;
        } else if (isDrawingSelection && selectionRect) {
          const pointer = canvas.getPointer(opt.e);
          let width = pointer.x - startX;
          let height = pointer.y - startY;
          
          selectionRect.set({ 
            width: Math.abs(width), 
            height: Math.abs(height),
            left: width > 0 ? startX : pointer.x,
            top: height > 0 ? startY : pointer.y,
          });
          canvas.requestRenderAll();
        }
      });
      
      canvas.on('mouse:up', function (opt: fabric.IEvent<MouseEvent>) {
        if (isPanning) {
          if (canvas.viewportTransform) canvas.setViewportTransform(canvas.viewportTransform);
          isPanning = false;
          canvas.selection = true;
        } else if (isDrawingSelection && selectionRect) {
          isDrawingSelection = false;
          const finalWidth = selectionRect.width || 0;
          const finalHeight = selectionRect.height || 0;
          
          if (finalWidth > 5 && finalHeight > 5) {
            const newBBox: [number, number, number, number] = [
              selectionRect.left!,
              selectionRect.top!,
              selectionRect.left! + finalWidth,
              selectionRect.top! + finalHeight,
            ];
            onNewAreaSelect(newBBox);
          }
          canvas.remove(selectionRect); 
          selectionRect = null;
          canvas.requestRenderAll();
        }
      });

      const handleSelection = (e: fabric.IEvent) => {
        if (e.selected && e.selected.length === 1 && e.selected[0].data?.id) {
          setSelectedAreaId(e.selected[0].data.id);
        } else {
          setSelectedAreaId(null);
        }
      };
      canvas.on('selection:created', handleSelection);
      canvas.on('selection:updated', handleSelection);
      canvas.on('selection:cleared', () => setSelectedAreaId(null));

      canvas.on('object:modified', (e: fabric.IEvent) => {
        const modifiedObject = e.target;
        if (modifiedObject && modifiedObject.data?.id && modifiedObject.data?.type === 'ocrTextBox') {
          const areaId = modifiedObject.data.id;
          const fabricTextbox = modifiedObject as fabric.Textbox;

          setAreas((prevAreas: Area[]) => 
            prevAreas.map((area: Area) => { 
              if (area.id === areaId) {
                const newWidth = fabricTextbox.getScaledWidth();
                const newHeight = fabricTextbox.getScaledHeight();
                let newFontSize = area.style.fontSize;
                
                return { 
                  ...area, 
                  translatedString: fabricTextbox.text || '',
                  bbox: [
                    fabricTextbox.left!,
                    fabricTextbox.top!,
                    fabricTextbox.left! + newWidth, 
                    fabricTextbox.top! + newHeight
                  ],
                  style: {
                    ...area.style,
                    fontSize: newFontSize,
                    textAlign: fabricTextbox.textAlign as Area['style']['textAlign'] || area.style.textAlign,
                  }
                };
              }
              return area;
            })
          );
        }
      });
      
      canvas.on('text:changed', (e: fabric.IEvent) => {
        const changedObject = e.target as fabric.Textbox;
        if (changedObject && changedObject.data?.id && changedObject.data?.type === 'ocrTextBox') {
          const id = changedObject.data.id;
          setAreas((prevAreas: Area[]) => prevAreas.map((area: Area) => 
            area.id === id 
              ? { ...area, translatedString: changedObject.text || '' } 
              : area
          ));
        }
      });

      return () => {
        setFabricCanvasInstance(null);
        canvas.dispose();
        fabricCanvasRef.current = null;
      };
    }
  }, [displaySize, setSelectedAreaId, setAreas, setFabricCanvasInstance]); 

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (canvas && backgroundImageUrl) {
      fabric.Image.fromURL(backgroundImageUrl, (img) => {
        canvas.backgroundImage = undefined;
        canvas.renderAll();
        
        const MAX_CANVAS_WIDTH = 1200; 
        const MAX_CANVAS_HEIGHT = 800;
        const MIN_CANVAS_WIDTH = 300;
        const MIN_CANVAS_HEIGHT = 200;

        let newWidth = img.width || MAX_CANVAS_WIDTH;
        let newHeight = img.height || MAX_CANVAS_HEIGHT;
        const imgAspectRatio = newWidth / newHeight;
        const maxCanvasAspectRatio = MAX_CANVAS_WIDTH / MAX_CANVAS_HEIGHT;

        if (imgAspectRatio > maxCanvasAspectRatio) {
            if (newWidth > MAX_CANVAS_WIDTH) {
                newWidth = MAX_CANVAS_WIDTH;
                newHeight = newWidth / imgAspectRatio;
            }
        } else {
            if (newHeight > MAX_CANVAS_HEIGHT) {
                newHeight = MAX_CANVAS_HEIGHT;
                newWidth = newHeight * imgAspectRatio;
            }
        }
        
        newWidth = Math.max(newWidth, MIN_CANVAS_WIDTH);
        newHeight = Math.max(newHeight, MIN_CANVAS_HEIGHT);
        
        if (displaySize.width !== newWidth || displaySize.height !== newHeight) {
            setDisplaySize({ width: Math.round(newWidth), height: Math.round(newHeight) });
        }
        
        img.scaleToWidth(Math.round(newWidth));
        if(img.getScaledHeight() > Math.round(newHeight)) {
            img.scaleToHeight(Math.round(newHeight));
        }
        
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
          selectable: false, evented: false, originX: 'left', originY: 'top',
        });
        canvas.renderAll();
      }, { crossOrigin: 'anonymous' });
    } else if (canvas) {
      canvas.clear(); 
      canvas.backgroundImage = undefined;
      canvas.renderAll();
      if (displaySize.width !== 800 || displaySize.height !== 600) {
          setDisplaySize({ width: 800, height: 600 });
      }
    }
  }, [backgroundImageUrl]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      canvas.getObjects().filter((obj: fabric.Object) => obj.data?.type === 'ocrTextBox').forEach((obj: fabric.Object) => canvas.remove(obj));

      areas.forEach((area: Area) => {
        const textboxOptions: fabric.ITextboxOptions = {
          left: area.bbox[0],
          top: area.bbox[1],
          width: area.bbox[2] - area.bbox[0],
          height: area.bbox[3] - area.bbox[1],
          fontSize: area.style.fontSize,
          fill: area.style.color,
          backgroundColor: area.style.backgroundColor,
          fontFamily: area.style.fontFamily,
          fontWeight: area.style.fontWeight,
          fontStyle: area.style.fontStyle,
          textAlign: area.style.textAlign as fabric.Textbox["textAlign"],
          underline: area.style.textDecoration === 'underline',
          linethrough: area.style.textDecoration === 'line-through',
          overline: area.style.textDecoration === 'overline',
          data: { id: area.id, type: 'ocrTextBox' },
        };
        const textbox = new fabric.Textbox(area.translatedString || area.sourceString || "Text", textboxOptions);
        
        if (selectedAreaId === area.id) {
            textbox.set({ borderColor: '#a78bfa', borderScaleFactor: 2, borderDashArray: undefined });
        } else {
            textbox.set({ borderColor: '#8b5cf6', borderScaleFactor: 1.5, borderDashArray: [6,3] });
        }

        canvas.add(textbox);
      });
      canvas.renderAll();
    }
  }, [areas, selectedAreaId, backgroundImageUrl]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      const activeObject = canvas.getActiveObject();
      if (selectedAreaId) {
        if (activeObject?.data?.id !== selectedAreaId) {
          const objectToSelect = canvas.getObjects().find((obj: fabric.Object) => obj.data?.id === selectedAreaId && obj.data?.type === 'ocrTextBox');
          if (objectToSelect) {
            canvas.setActiveObject(objectToSelect);
          }
        }
      } else {
        if (activeObject) {
          canvas.discardActiveObject();
        }
      }
      canvas.renderAll();
    }
  }, [selectedAreaId]);

  return (
    <div 
      style={{ 
        width: displaySize.width, 
        height: displaySize.height, 
        border: '1px solid #374151'
      }}
      className="mx-auto shadow-2xl rounded-md overflow-hidden"
    >
      <canvas ref={canvasRef} />
    </div>
  );
};

export default ImageCanvas;