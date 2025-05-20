
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, FileText, File } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentUploaderProps {
  onDocumentsChange: (files: File[]) => void;
}

export function DocumentUploader({ onDocumentsChange }: DocumentUploaderProps) {
  const [documents, setDocuments] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Gérer le téléchargement de documents
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      addFiles(newFiles);
    }
  };

  // Gérer le glisser-déposer
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Gérer le dépôt de fichiers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      addFiles(newFiles);
    }
  };

  // Ajouter des fichiers à la liste
  const addFiles = (newFiles: File[]) => {
    const updatedFiles = [...documents, ...newFiles];
    setDocuments(updatedFiles);
    onDocumentsChange(updatedFiles);
  };

  // Supprimer un fichier
  const removeFile = (indexToRemove: number) => {
    const updatedFiles = documents.filter((_, index) => index !== indexToRemove);
    setDocuments(updatedFiles);
    onDocumentsChange(updatedFiles);
  };

  // Ouvrir l'explorateur de fichiers
  const openFileExplorer = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Formater la taille des fichiers
  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} octets`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} Ko`;
    return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
  };

  // Obtenir l'icône en fonction du type de fichier
  const getFileIcon = (file: File) => {
    if (file.type.includes('image')) {
      return <img 
        src={URL.createObjectURL(file)} 
        alt={file.name} 
        className="w-10 h-10 object-cover rounded-md"
      />;
    } else if (file.type.includes('pdf')) {
      return <FileText className="w-10 h-10 text-red-500" />;
    } else {
      return <File className="w-10 h-10 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          dragActive 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50 hover:bg-accent/50"
        )}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={openFileExplorer}
      >
        <Input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          accept="image/*,application/pdf,.doc,.docx"
        />
        <div className="flex flex-col items-center">
          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">
            Glissez-déposez ou cliquez pour ajouter des documents
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Formats acceptés : Images, PDF, DOC
          </p>
        </div>
      </div>

      {documents.length > 0 && (
        <div className="space-y-2">
          <Label>Documents sélectionnés ({documents.length})</Label>
          <div className="border rounded-md divide-y">
            {documents.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file)}
                  <div className="space-y-1">
                    <p className="text-sm font-medium truncate max-w-[200px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
