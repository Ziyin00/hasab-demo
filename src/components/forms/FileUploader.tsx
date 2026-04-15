"use client";

import { useFormContext } from "react-hook-form";
import { UploadCloud, FileAudio, X } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";

interface FileUploaderProps {
  name: string;
  label: string;
  accept?: string[];
}

export const FileUploader = ({ name, label, accept }: FileUploaderProps) => {
  const { setValue, watch, formState: { errors } } = useFormContext();
  const file = watch(name);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (files: FileList | null) => {
    if (files && files[0]) {
      setValue(name, files[0], { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div 
        className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 transition-all ${
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFile(e.dataTransfer.files);
        }}
      >
        <input 
          type="file" 
          className="hidden" 
          ref={inputRef}
          accept={accept?.join(",")}
          onChange={(e) => handleFile(e.target.files)}
        />

        {file ? (
          <div className="flex flex-col items-center gap-2">
            <div className="p-4 bg-primary/10 rounded-full">
              <FileAudio className="w-10 h-10 text-primary" />
            </div>
            <p className="font-medium">{file.name}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setValue(name, null)}
              className="text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4 mr-2" /> Remove
            </Button>
          </div>
        ) : (
          <>
            <div className="p-4 bg-accent rounded-full text-muted-foreground">
              <UploadCloud className="w-10 h-10" />
            </div>
            <div className="text-center">
              <p className="font-medium mb-1">{label}</p>
              <p className="text-sm text-muted-foreground">
                Drag and drop or click to browse
              </p>
            </div>
            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
              Choose File
            </Button>
          </>
        )}
      </div>
      {errors[name] && (
        <p className="text-sm text-destructive text-center">{errors[name]?.message as string}</p>
      )}
    </div>
  );
};
