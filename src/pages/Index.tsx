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
    if (!draggedElement) return;
    
    const canvas = e.currentTarget as HTMLElement;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - 20;
    const y = e.clientY - rect.top - 10;
    
    updateElement(draggedElement, { x: Math.max(0, x), y: Math.max(0, y) });
  };

  const handleMouseUp = () => {
    setDraggedElement(null);
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
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Editor de Etiquetas</h1>
          </div>
          
          <Button onClick={() => setShowPreview(true)} className="gap-2">
            <Eye className="h-4 w-4" />
            Visualizar e Imprimir
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 border-r border-border bg-panel flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                  <Settings className="h-4 w-4" />
                  Adicionar Elementos
                </h2>
                <div className="grid grid-cols-1 gap-2">
                  <Button variant="outline" className="justify-start gap-2" onClick={() => addElement("text")}>
                    <Type className="h-4 w-4" />
                    Texto / Nome
                  </Button>
                  <Button variant="outline" className="justify-start gap-2" onClick={() => addElement("price")}>
                    <DollarSign className="h-4 w-4" />
                    Preço
                  </Button>
                  <Button variant="outline" className="justify-start gap-2" onClick={() => addElement("barcode")}>
                    <BarcodeIcon className="h-4 w-4" />
                    Código de Barras
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h2 className="text-sm font-semibold mb-3 text-foreground">
                  Elementos ({elements.length})
                </h2>
                <div className="space-y-2">
                  {elements.map((element) => (
                    <Card
                      key={element.id}
                      className={`p-3 cursor-pointer transition-colors ${
                        selectedElement === element.id
                          ? "bg-accent text-accent-foreground border-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedElement(element.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {element.type === "text" && <Type className="h-4 w-4" />}
                          {element.type === "price" && <DollarSign className="h-4 w-4" />}
                          {element.type === "barcode" && <BarcodeIcon className="h-4 w-4" />}
                          <span className="text-sm font-medium">{element.label}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
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
                    <h2 className="text-sm font-semibold mb-3 text-foreground">
                      Propriedades
                    </h2>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="label">Nome do Campo</Label>
                        <Input
                          id="label"
                          value={selected.label}
                          onChange={(e) => updateElement(selected.id, { label: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="value">Valor</Label>
                        <Input
                          id="value"
                          value={selected.value}
                          onChange={(e) => updateElement(selected.id, { value: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="fontSize">Tamanho da Fonte</Label>
                        <Input
                          id="fontSize"
                          type="number"
                          value={selected.fontSize}
                          onChange={(e) => updateElement(selected.id, { fontSize: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="color">Cor</Label>
                        <Input
                          id="color"
                          type="color"
                          value={selected.color}
                          onChange={(e) => updateElement(selected.id, { color: e.target.value })}
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

        <main className="flex-1 bg-canvas p-8 overflow-auto">
          <div className="flex items-center justify-center min-h-full">
            <div
              className="bg-card border-2 border-canvas-border rounded-lg shadow-lg relative select-none"
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
                  className={`absolute cursor-move p-2 rounded ${
                    selectedElement === element.id
                      ? "ring-2 ring-element-border"
                      : "hover:ring-1 hover:ring-element-border"
                  }`}
                  style={{
                    left: `${element.x}px`,
                    top: `${element.y}px`,
                    fontSize: `${element.fontSize}px`,
                    color: element.color,
                  }}
                  onMouseDown={(e) => handleMouseDown(element.id, e)}
                >
                  {element.type === "barcode" ? (
                    <div className="font-mono border border-gray-400 px-2 py-1">
                      {element.value}
                    </div>
                  ) : (
                    <div className="whitespace-nowrap">{element.value}</div>
                  )}
                </div>
              ))}
              {elements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none">
                  <p className="text-center">
                    Adicione elementos usando o painel lateral
                  </p>
                </div>
              )}
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
            <div className="grid gap-4 p-4" style={{
              gridTemplateColumns: `repeat(auto-fill, ${labelConfig.width}mm)`,
              justifyContent: "center"
            }}>
              {Array.from({ length: labelConfig.quantity }).map((_, index) => (
                <div
                  key={index}
                  className="border border-gray-300 relative bg-white print:break-inside-avoid"
                  style={{
                    width: `${labelConfig.width}mm`,
                    height: `${labelConfig.height}mm`,
                  }}
                >
                  {elements.map((element) => (
                    <div
                      key={element.id}
                      className="absolute"
                      style={{
                        left: `${(element.x / labelWidth) * 100}%`,
                        top: `${(element.y / labelHeight) * 100}%`,
                        fontSize: `${element.fontSize}px`,
                        color: element.color,
                      }}
                    >
                      {element.type === "barcode" ? (
                        <div className="font-mono border border-gray-400 px-1 text-xs">
                          {element.value}
                        </div>
                      ) : (
                        <div className="whitespace-nowrap">{element.value}</div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
