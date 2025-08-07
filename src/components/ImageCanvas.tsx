'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { useEditorContext } from '@/contexts/EditorContext';
import { Area } from '@/types';
import ContextMenu from '@/components/ContextMenu';

interface ImageCanvasProps {
  onNewAreaSelect: (bbox: [number, number, number, number]) => void;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({ onNewAreaSelect }) => {
  const {
    areas, setAreas,
    selectedAreaIds, setSelectedAreaIds,
    backgroundImageUrl,
    setFabricCanvasInstance,
    editorMode,
  } = useEditorContext();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const isProgrammaticSelection = useRef(false);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    menuItems: any[];
  }>({ show: false, x: 0, y: 0, menuItems: [] });

  const handleSelection = useCallback((e: fabric.IEvent) => {
    if (isProgrammaticSelection.current) {
      isProgrammaticSelection.current = false;
      return;
    }
    const selectedObjects = e.selected;
    if (selectedObjects && selectedObjects.length > 0) {
      const selectedIds = selectedObjects.map(obj => obj.data?.id).filter(id => id);
      setSelectedAreaIds(selectedIds);
    } else {
      setSelectedAreaIds([]);
    }
  }, [setSelectedAreaIds]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvasContainer = canvasRef.current.parentElement;
    if (!canvasContainer) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: canvasContainer.clientWidth,
      height: canvasContainer.clientHeight,
      backgroundColor: '#18181b',
      selectionColor: 'rgba(99, 102, 241, 0.3)',
      selectionBorderColor: '#8b5cf6',
      selectionLineWidth: 2,
      selectionDashArray: [6, 3],
      stopContextMenu: true,
    });
    fabricCanvasRef.current = canvas;
    setFabricCanvasInstance(canvas);

    // --- Complete mouse event listeners (your original logic) ---
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
      const target = opt.target;

      switch (editorMode) {
        case 'pan':
          isPanning = true;
          canvas.selection = false;
          lastPosX = opt.e.clientX;
          lastPosY = opt.e.clientY;
          break;
        case 'select':
          if (target) {
            canvas.selection = true;
          } else {
            isDrawingSelection = true;
            const pointer = canvas.getPointer(opt.e);
            startX = pointer.x;
            startY = pointer.y;
            selectionRect = new fabric.Rect({
              left: startX, top: startY, width: 0, height: 0,
              fill: 'rgba(99, 102, 241, 0.3)',
              stroke: '#8b5cf6', strokeWidth: 1,
              strokeDashArray: [4, 2],
              selectable: false, evented: false,
            });
            canvas.add(selectionRect);
          }
          break;
        case 'create':
          isDrawingSelection = true;
          const pointer = canvas.getPointer(opt.e);
          startX = pointer.x;
          startY = pointer.y;
          selectionRect = new fabric.Rect({
            left: startX, top: startY, width: 0, height: 0,
            fill: 'rgba(139, 92, 246, 0.2)',
            stroke: '#8b5cf6', strokeWidth: 1,
            strokeDashArray: [4, 2],
            selectable: false, evented: false,
          });
          canvas.add(selectionRect);
          break;
      }
    });

    canvas.on('mouse:move', function (opt: fabric.IEvent<MouseEvent>) {
      if (isPanning && canvas.viewportTransform) {
        const e = opt.e;
        const vpt = canvas.viewportTransform;
        vpt[4] += e.clientX - lastPosX;
        vpt[5] += e.clientY - lastPosY;
        lastPosX = e.clientX;
        lastPosY = e.clientY;
      } else if (isDrawingSelection && selectionRect) {
        const pointer = canvas.getPointer(opt.e);
        let width = pointer.x - startX;
        let height = pointer.y - startY;
        selectionRect.set({
          width: Math.abs(width), height: Math.abs(height),
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
        if (editorMode === 'create') {
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
        }
        canvas.remove(selectionRect);
        selectionRect = null;
      }
    });

    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', () => setSelectedAreaIds([]));

    canvas.on('object:modified', (e: fabric.IEvent) => {
      const modifiedObject = e.target;
      if (modifiedObject && modifiedObject.data?.id && modifiedObject.data?.type === 'ocrTextBox') {
        const areaId = modifiedObject.data.id;
        const fabricTextbox = modifiedObject as fabric.Textbox;
        setAreas((prevAreas: Area[]) => prevAreas.map((area: Area) => {
          if (area.id === areaId) {
            return {
              ...area,
              translatedString: fabricTextbox.text || '',
              bbox: [
                fabricTextbox.left!, fabricTextbox.top!,
                fabricTextbox.left! + fabricTextbox.getScaledWidth(),
                fabricTextbox.top! + fabricTextbox.getScaledHeight()
              ],
              style: {
                ...area.style,
                textAlign: fabricTextbox.textAlign as Area['style']['textAlign'] || area.style.textAlign,
              }
            };
          }
          return area;
        }));
      }
    });

    canvas.on('text:changed', (e) => {
      const changedObject = e.target as fabric.Textbox;
      if (changedObject?.isEditing) {
        return;
      }
      if (changedObject && changedObject.data?.id && changedObject.data?.type === 'ocrTextBox') {
        const id = changedObject.data.id;
        setAreas((prevAreas: Area[]) => {
          const newAreas = [...prevAreas];
          const areaIndex = newAreas.findIndex(a => a.id === id);
          if (areaIndex !== -1) {
            const newArea = { ...newAreas[areaIndex] };
            newArea.translatedString = changedObject.text || '';
            newArea.bbox = [
              changedObject.left!,
              changedObject.top!,
              changedObject.left! + (changedObject.width || 0),
              changedObject.top! + (changedObject.height || 0)
            ];
            newAreas[areaIndex] = newArea;
          }
          return newAreas;
        });
      }
    });

    canvas.on('composition:update', (e) => {
      const changedObject = e.target as fabric.Textbox;
      if (changedObject && changedObject.data?.id && changedObject.data?.type === 'ocrTextBox') {
        const id = changedObject.data.id;
        setTimeout(() => {
          setAreas((prevAreas: Area[]) => {
            const newAreas = [...prevAreas];
            const areaIndex = newAreas.findIndex(a => a.id === id);
            if (areaIndex !== -1) {
              const newArea = { ...newAreas[areaIndex] };
              newArea.translatedString = changedObject.text || '';
              newArea.bbox = [
                changedObject.left!,
                changedObject.top!,
                changedObject.left! + (changedObject.width || 0),
                changedObject.top! + (changedObject.height || 0)
              ];
              newAreas[areaIndex] = newArea;
            }
            return newAreas;
          });
        }, 10);
      }
    });

    // --- Background image loading ---
    if (backgroundImageUrl) {
      fabric.Image.fromURL(backgroundImageUrl, (img) => {
        if (!fabricCanvasRef.current) {
          return;
        }

        const currentCanvas = fabricCanvasRef.current;
        currentCanvas.backgroundImage = undefined;
        currentCanvas.renderAll();

        if (canvas.width) {
          img.scaleToWidth(canvas.width);
        }
        if (canvas.height && img.getScaledHeight() > canvas.height) {
            img.scaleToHeight(canvas.height);
        }

        currentCanvas.setBackgroundImage(img, currentCanvas.renderAll.bind(currentCanvas), {
          selectable: false, evented: false, originX: 'left', originY: 'top',
        });
      }, { crossOrigin: 'anonymous' });
    } else {
      canvas.clear();
      canvas.backgroundImage = undefined;
      canvas.renderAll();
    }

    // --- [Restored] Text area rendering ---
    canvas.getObjects().filter((obj: fabric.Object) => obj.data?.type === 'ocrTextBox').forEach((obj: fabric.Object) => canvas.remove(obj));
    areas.forEach((area: Area) => {
      const textboxOptions: fabric.ITextboxOptions = {
        left: area.bbox[0], top: area.bbox[1],
        width: area.bbox[2] - area.bbox[0], height: area.bbox[3] - area.bbox[1],
        fontSize: area.style.fontSize, fill: area.style.color,
        backgroundColor: area.style.backgroundColor, fontFamily: area.style.fontFamily,
        fontWeight: area.style.fontWeight, fontStyle: area.style.fontStyle,
        textAlign: area.style.textAlign as fabric.Textbox["textAlign"],
        underline: area.style.textDecoration === 'underline',
        linethrough: area.style.textDecoration === 'line-through',
        overline: area.style.textDecoration === 'overline',
        data: { id: area.id, type: 'ocrTextBox' },
      };
      const textbox = new fabric.Textbox(area.translatedString || area.sourceString || "Text", textboxOptions);

      if (selectedAreaIds.includes(area.id)) {
          textbox.set({ borderColor: '#a78bfa', borderScaleFactor: 2, borderDashArray: undefined });
      } else {
          textbox.set({ borderColor: '#8b5cf6', borderScaleFactor: 1.5, borderDashArray: [6,3] });
      }
      canvas.add(textbox);
    });

    // --- [Restored] Object selection state handling ---
    // This is now handled in a separate useEffect
    canvas.renderAll();

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      canvas.setWidth(width);
      canvas.setHeight(height);
      canvas.renderAll();
    });

    resizeObserver.observe(canvasContainer);

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeObject = fabricCanvasRef.current?.getActiveObject();
      if (activeObject && (activeObject as fabric.Textbox).isEditing) {
        // Let the default behavior handle text deletion
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && e.target === document.body) {
        if (selectedAreaIds.length > 0) {
          setAreas(areas.filter(a => !selectedAreaIds.includes(a.id)));
          setSelectedAreaIds([]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // --- Cleanup function ---
    return () => {
      resizeObserver.disconnect();
      document.removeEventListener('keydown', handleKeyDown);
      setFabricCanvasInstance(null);
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [backgroundImageUrl, areas, onNewAreaSelect, setAreas, setFabricCanvasInstance, handleSelection, editorMode]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeSelection = canvas.getActiveObject();
    const activeIds = activeSelection instanceof fabric.ActiveSelection
      ? activeSelection.getObjects().map(o => o.data.id)
      : (activeSelection ? [activeSelection.data.id] : []);

    if (JSON.stringify(activeIds.sort()) !== JSON.stringify(selectedAreaIds.sort())) {
      isProgrammaticSelection.current = true;
      if (selectedAreaIds.length === 0) {
        canvas.discardActiveObject();
      } else {
        const objectsToSelect = canvas.getObjects().filter(obj =>
          obj.data?.type === 'ocrTextBox' && selectedAreaIds.includes(obj.data.id)
        );
        if (objectsToSelect.length > 0) {
          if (objectsToSelect.length === 1) {
            canvas.setActiveObject(objectsToSelect[0]);
          } else {
            const sel = new fabric.ActiveSelection(objectsToSelect, { canvas: canvas });
            canvas.setActiveObject(sel);
          }
        } else {
          canvas.discardActiveObject();
        }
      }
      canvas.requestRenderAll();
    }
  }, [selectedAreaIds]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    const pointer = fabricCanvas.getPointer(e.nativeEvent);
    const target = fabricCanvas.findTarget(e.nativeEvent, false);

    if (target && target.data?.id && selectedAreaIds.includes(target.data.id)) {
      const bringToFront = () => {
        const newAreas = [...areas];
        const selected = newAreas.filter(a => selectedAreaIds.includes(a.id));
        const others = newAreas.filter(a => !selectedAreaIds.includes(a.id));
        setAreas([...others, ...selected]);
      };

      const sendToBack = () => {
        const newAreas = [...areas];
        const selected = newAreas.filter(a => selectedAreaIds.includes(a.id));
        const others = newAreas.filter(a => !selectedAreaIds.includes(a.id));
        setAreas([...selected, ...others]);
      };

      setContextMenu({
        show: true,
        x: e.clientX,
        y: e.clientY,
        menuItems: [
          { label: 'Bring to front', action: bringToFront },
          { label: 'Send to back', action: sendToBack },
        ],
      });
    } else {
      setContextMenu({ show: false, x: 0, y: 0, menuItems: [] });
    }
  };

  return (
    <div
      className="w-full h-full aspect-video mx-auto shadow-2xl rounded-md overflow-hidden border border-gray-700"
      onContextMenu={handleContextMenu}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
      <ContextMenu {...contextMenu} onClose={() => setContextMenu({ ...contextMenu, show: false })} />
    </div>
  );
};

export default ImageCanvas;