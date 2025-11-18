import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Type, DollarSign, Barcode as BarcodeIcon, Trash2, Settings, FileText, Eye, Download } from "lucide-react";
import { toast } from "sonner";

type ElementType = "text" | "barcode" | "price";

interface LabelElement {
  id: string;
  type: ElementType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  color: string;
  value: string;
}

interface LabelConfig {
  width: number;
  height: number;
  quantity: number;
}

const Index = () => {
  const [elements, setElements] = useState<LabelElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [resizingElement, setResizingElement] = useState<{ id: string; handle: string } | null>(null);
  const [labelConfig, setLabelConfig] = useState<LabelConfig>({
    width: 50,
    height: 30,
    quantity: 10,
  });
  const [showPreview, setShowPreview] = useState(false);

  const mmToPx = (mm: number) => (mm * 96) / 25.4;

  const addElement = (type: ElementType) => {
    const newElement: LabelElement = {
      id: `${type}-${Date.now()}`,
      type,
      label: type === "text" ? "Nome" : type === "price" ? "Preço" : "Código",
      x: 10,
      y: 10,
      width: type === "barcode" ? 120 : 100,
      height: type === "barcode" ? 40 : 30,
      fontSize: type === "barcode" ? 12 : 16,
      color: "#000000",
      value: type === "price" ? "R$ 0,00" : type === "barcode" ? "123456789" : "Texto",
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const updateElement = (id: string, updates: Partial<LabelElement>) => {
    setElements(elements.map((el) => (el.id === id ? { ...el, ...updates } : el)));
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter((el) => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  };

  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggedElement(id);
    setSelectedElement(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedElement) {
      const canvas = e.currentTarget as HTMLElement;
      const rect = canvas.getBoundingClientRect();
      const element = elements.find((el) => el.id === draggedElement);
      if (!element) return;
      
      const x = e.clientX - rect.left - element.width / 2;
      const y = e.clientY - rect.top - element.height / 2;
      
      updateElement(draggedElement, { x: Math.max(0, x), y: Math.max(0, y) });
    }
    
    if (resizingElement) {
      const canvas = e.currentTarget as HTMLElement;
      const rect = canvas.getBoundingClientRect();
      const element = elements.find((el) => el.id === resizingElement.id);
      if (!element) return;
      
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      let newWidth = element.width;
      let newHeight = element.height;
      let newX = element.x;
      let newY = element.y;
      
      switch (resizingElement.handle) {
        case "se":
          newWidth = Math.max(30, mouseX - element.x);
          newHeight = Math.max(20, mouseY - element.y);
          break;
        case "sw":
          newWidth = Math.max(30, element.x + element.width - mouseX);
          newHeight = Math.max(20, mouseY - element.y);
          newX = Math.min(mouseX, element.x + element.width - 30);
          break;
        case "ne":
          newWidth = Math.max(30, mouseX - element.x);
          newHeight = Math.max(20, element.y + element.height - mouseY);
          newY = Math.min(mouseY, element.y + element.height - 20);
          break;
        case "nw":
          newWidth = Math.max(30, element.x + element.width - mouseX);
          newHeight = Math.max(20, element.y + element.height - mouseY);
          newX = Math.min(mouseX, element.x + element.width - 30);
          newY = Math.min(mouseY, element.y + element.height - 20);
          break;
      }
      
      updateElement(resizingElement.id, { 
        width: newWidth, 
        height: newHeight,
        x: newX,
        y: newY
      });
    }
  };

  const handleMouseUp = () => {
    setDraggedElement(null);
    setResizingElement(null);
  };

  const handleResizeStart = (id: string, handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingElement({ id, handle });
    setSelectedElement(id);
  };

  const selected = elements.find((el) => el.id === selectedElement);
  const labelWidth = mmToPx(labelConfig.width);
  const labelHeight = mmToPx(labelConfig.height);

  const handlePrint = () => {
    toast.success("Use Ctrl+P para imprimir ou salvar como PDF!");
    window.print();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-gradient-to-r from-card to-card shadow-md">
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-lg shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Editor de Etiquetas
              </h1>
              <p className="text-xs text-muted-foreground">Design profissional e moderno</p>
            </div>
          </div>
          
          <Button onClick={() => setShowPreview(true)} className="gap-2 shadow-lg">
            <Eye className="h-4 w-4" />
            Visualizar e Imprimir
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 border-r border-border bg-panel flex flex-col shadow-xl">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                  <span className="w-1 h-4 bg-gradient-to-b from-primary to-secondary rounded-full"></span>
                  Adicionar Elementos
                </h2>
                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    variant="outline" 
                    className="justify-start gap-2 hover:border-primary hover:bg-primary/5 transition-all" 
                    onClick={() => addElement("text")}
                  >
                    <Type className="h-4 w-4 text-primary" />
                    Texto / Nome
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start gap-2 hover:border-secondary hover:bg-secondary/5 transition-all" 
                    onClick={() => addElement("price")}
                  >
                    <DollarSign className="h-4 w-4 text-secondary" />
                    Preço
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start gap-2 hover:border-primary hover:bg-primary/5 transition-all" 
                    onClick={() => addElement("barcode")}
                  >
                    <BarcodeIcon className="h-4 w-4 text-primary" />
                    Código de Barras
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h2 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                  <span className="w-1 h-4 bg-gradient-to-b from-primary to-secondary rounded-full"></span>
                  Elementos ({elements.length})
                </h2>
                <div className="space-y-2">
                  {elements.map((element) => (
                    <Card
                      key={element.id}
                      className={`p-3 cursor-pointer transition-all duration-200 ${
                        selectedElement === element.id
                          ? "bg-gradient-to-r from-primary/10 to-secondary/10 border-primary shadow-md scale-105"
                          : "hover:bg-muted hover:shadow-sm hover:scale-102"
                      }`}
                      onClick={() => setSelectedElement(element.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {element.type === "text" && <Type className="h-4 w-4 text-primary" />}
                          {element.type === "price" && <DollarSign className="h-4 w-4 text-secondary" />}
                          {element.type === "barcode" && <BarcodeIcon className="h-4 w-4 text-primary" />}
                          <span className="text-sm font-medium">{element.label}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteElement(element.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {elements.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Adicione elementos à etiqueta
                    </p>
                  )}
                </div>
              </div>

              {selected && (
                <>
                  <Separator />
                  <div>
                    <h2 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                      <span className="w-1 h-4 bg-gradient-to-b from-primary to-secondary rounded-full"></span>
                      Propriedades
                    </h2>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="label" className="text-xs font-medium">Nome do Campo</Label>
                        <Input
                          id="label"
                          value={selected.label}
                          onChange={(e) => updateElement(selected.id, { label: e.target.value })}
                          className="mt-1.5 focus:border-primary"
                        />
                      </div>
                      <div>
                        <Label htmlFor="value" className="text-xs font-medium">Valor</Label>
                        <Input
                          id="value"
                          value={selected.value}
                          onChange={(e) => updateElement(selected.id, { value: e.target.value })}
                          className="mt-1.5 focus:border-primary"
                        />
                      </div>
                      <div>
                        <Label htmlFor="fontSize" className="text-xs font-medium">Tamanho da Fonte</Label>
                        <Input
                          id="fontSize"
                          type="number"
                          value={selected.fontSize}
                          onChange={(e) => updateElement(selected.id, { fontSize: parseInt(e.target.value) })}
                          className="mt-1.5 focus:border-primary"
                        />
                      </div>
                      <div>
                        <Label htmlFor="color" className="text-xs font-medium">Cor</Label>
                        <Input
                          id="color"
                          type="color"
                          value={selected.color}
                          onChange={(e) => updateElement(selected.id, { color: e.target.value })}
                          className="mt-1.5 h-10 focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <h2 className="text-sm font-semibold mb-3 text-foreground">
                  Configuração da Etiqueta
                </h2>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="width">Largura (mm)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={labelConfig.width}
                      onChange={(e) => setLabelConfig({ ...labelConfig, width: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Altura (mm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={labelConfig.height}
                      onChange={(e) => setLabelConfig({ ...labelConfig, height: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantidade</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={labelConfig.quantity}
                      onChange={(e) => setLabelConfig({ ...labelConfig, quantity: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>

        <main className="flex-1 bg-canvas overflow-auto">
          <div className="relative inline-block">
            {/* Canto superior esquerdo (interseção das réguas) */}
            <div className="absolute left-0 top-0 w-[30px] h-[25px] bg-background/80 border-r border-b border-border shadow-sm z-10" />
            
            {/* Régua Horizontal */}
            <div className="absolute left-[30px] top-0 h-[25px] bg-background/80 border-b border-border shadow-sm z-10" style={{ width: `${labelWidth}px` }}>
              <div className="relative w-full h-full">
                {Array.from({ length: Math.ceil(labelConfig.width) + 1 }).map((_, i) => {
                  const mm = i;
                  const pixelPos = mmToPx(mm);
                  const isMajor = mm % 10 === 0;
                  const isMid = mm % 5 === 0;
                  
                  return (
                    <div
                      key={i}
                      className="absolute"
                      style={{ left: `${pixelPos}px` }}
                    >
                      {isMajor ? (
                        <>
                          <div className="w-[1px] h-4 bg-foreground/60" />
                          <span className="absolute top-[14px] -left-2 text-[10px] font-medium text-foreground/80 select-none">
                            {mm}
                          </span>
                        </>
                      ) : isMid ? (
                        <div className="w-[1px] h-3 bg-foreground/40" />
                      ) : (
                        <div className="w-[1px] h-2 bg-foreground/25" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Régua Vertical */}
            <div className="absolute left-0 top-[25px] w-[30px] bg-background/80 border-r border-border shadow-sm z-10" style={{ height: `${labelHeight}px` }}>
              <div className="relative w-full h-full">
                {Array.from({ length: Math.ceil(labelConfig.height) + 1 }).map((_, i) => {
                  const mm = i;
                  const pixelPos = mmToPx(mm);
                  const isMajor = mm % 10 === 0;
                  const isMid = mm % 5 === 0;
                  
                  return (
                    <div
                      key={i}
                      className="absolute"
                      style={{ top: `${pixelPos}px` }}
                    >
                      {isMajor ? (
                        <>
                          <div className="h-[1px] w-4 bg-foreground/60" />
                          <span className="absolute left-[5px] -top-1.5 text-[10px] font-medium text-foreground/80 select-none">
                            {mm}
                          </span>
                        </>
                      ) : isMid ? (
                        <div className="h-[1px] w-3 bg-foreground/40" />
                      ) : (
                        <div className="h-[1px] w-2 bg-foreground/25" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Canvas com margem para as réguas */}
            <div className="ml-[30px] mt-[25px]">
              <div
                className="bg-card border-2 border-canvas-border rounded-xl shadow-2xl relative select-none transition-all duration-300 hover:shadow-primary/10"
                style={{
                  width: `${labelWidth}px`,
                  height: `${labelHeight}px`,
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
              {elements.map((element) => (
                <div
                  key={element.id}
                  className={`absolute cursor-move select-none transition-all duration-200 ${
                    selectedElement === element.id
                      ? "ring-2 ring-primary shadow-lg shadow-primary/20 scale-105"
                      : "hover:ring-2 hover:ring-primary/50"
                  }`}
                  style={{
                    left: `${element.x}px`,
                    top: `${element.y}px`,
                    width: `${element.width}px`,
                    height: `${element.height}px`,
                  }}
                  onMouseDown={(e) => handleMouseDown(element.id, e)}
                >
                  <div
                    className="flex items-center justify-center w-full h-full p-2 rounded"
                    style={{
                      fontSize: `${element.fontSize}px`,
                      color: element.color,
                    }}
                  >
                    {element.type === "barcode" ? (
                      <div className="font-mono border-2 border-gray-400 px-2 py-1 rounded">
                        {element.value}
                      </div>
                    ) : (
                      <div className="whitespace-nowrap overflow-hidden text-ellipsis font-semibold">{element.value}</div>
                    )}
                  </div>
                  
                  {selectedElement === element.id && (
                    <>
                      <div
                        className="absolute w-4 h-4 bg-primary border-2 border-white rounded-full cursor-nwse-resize shadow-lg transition-transform hover:scale-125"
                        style={{ right: -8, bottom: -8 }}
                        onMouseDown={(e) => handleResizeStart(element.id, "se", e)}
                      />
                      <div
                        className="absolute w-4 h-4 bg-secondary border-2 border-white rounded-full cursor-nesw-resize shadow-lg transition-transform hover:scale-125"
                        style={{ left: -8, bottom: -8 }}
                        onMouseDown={(e) => handleResizeStart(element.id, "sw", e)}
                      />
                      <div
                        className="absolute w-4 h-4 bg-secondary border-2 border-white rounded-full cursor-nesw-resize shadow-lg transition-transform hover:scale-125"
                        style={{ right: -8, top: -8 }}
                        onMouseDown={(e) => handleResizeStart(element.id, "ne", e)}
                      />
                      <div
                        className="absolute w-4 h-4 bg-primary border-2 border-white rounded-full cursor-nwse-resize shadow-lg transition-transform hover:scale-125"
                        style={{ left: -8, top: -8 }}
                        onMouseDown={(e) => handleResizeStart(element.id, "nw", e)}
                      />
                    </>
                  )}
                </div>
              ))}
              {elements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none">
                  <p className="text-center font-medium">
                    Adicione elementos usando o painel lateral
                  </p>
                </div>
              )}
            </div>
            </div>
          </div>
        </main>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Visualização das Etiquetas</DialogTitle>
            <DialogDescription>
              {labelConfig.quantity} etiquetas - Pronto para imprimir
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end mb-4">
            <Button onClick={handlePrint} className="gap-2">
              <Download className="h-4 w-4" />
              Imprimir / Salvar PDF
            </Button>
          </div>

          <ScrollArea className="h-[65vh]">
            <div className="print-container">
              {Array.from({ length: labelConfig.quantity }).map((_, index) => {
                const labelsPerRow = Math.floor(210 / labelConfig.width);
                const labelsPerPage = labelsPerRow * Math.floor(297 / labelConfig.height);
                const needsPageBreak = index > 0 && index % labelsPerPage === 0;
                
                return (
                  <div
                    key={index}
                    className={`label-item border border-gray-300 relative bg-white ${needsPageBreak ? 'page-break' : ''}`}
                    style={{
                      width: `${labelConfig.width}mm`,
                      height: `${labelConfig.height}mm`,
                    }}
                  >
                    {elements.map((element) => (
                      <div
                        key={element.id}
                        className="absolute flex items-center justify-center"
                        style={{
                          left: `${(element.x / labelWidth) * 100}%`,
                          top: `${(element.y / labelHeight) * 100}%`,
                          width: `${(element.width / labelWidth) * 100}%`,
                          height: `${(element.height / labelHeight) * 100}%`,
                          fontSize: `${element.fontSize}px`,
                          color: element.color,
                        }}
                      >
                        {element.type === "barcode" ? (
                          <div className="font-mono border border-gray-400 px-1 text-xs">
                            {element.value}
                          </div>
                        ) : (
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">{element.value}</div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
