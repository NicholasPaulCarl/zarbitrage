import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

// Define Area type since the import isn't working
interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperProps {
  open: boolean;
  onClose: () => void;
  image: string | null;
  onCropComplete: (croppedImage: Blob) => void;
}

/**
 * Creates a cropped image using canvas
 */
const createCroppedImage = async (
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> => {
  const image = new Image();
  image.src = imageSrc;
  
  // Wait for image to load
  await new Promise((resolve) => {
    image.onload = resolve;
  });

  // Create canvas for cropping
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Set canvas dimensions to cropped area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw cropped image onto canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Convert canvas to blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Canvas is empty');
      }
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
};

export default function ImageCropper({ open, onClose, image, onCropComplete }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (newZoom: number[]) => {
    setZoom(newZoom[0]);
  };

  const onRotationChange = (newRotation: number[]) => {
    setRotation(newRotation[0]);
  };

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCropImage = async () => {
    if (!image || !croppedAreaPixels) {
      return;
    }

    try {
      const croppedImage = await createCroppedImage(image, croppedAreaPixels);
      onCropComplete(croppedImage);
      onClose();
    } catch (e) {
      console.error('Error cropping image:', e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
          <DialogDescription id="profile-picture-description">
            Crop, zoom and rotate your image
          </DialogDescription>
        </DialogHeader>
        
        <div className="w-full h-[300px] relative mb-4">
          {image && (
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={1}
              rotation={rotation}
              onCropChange={onCropChange}
              onCropComplete={onCropCompleteCallback}
              onZoomChange={(z) => setZoom(z)}
              onRotationChange={(r) => setRotation(r)}
            />
          )}
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Zoom</Label>
            <Slider 
              min={1} 
              max={3} 
              step={0.1} 
              value={[zoom]} 
              onValueChange={onZoomChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Rotation</Label>
            <Slider 
              min={0} 
              max={360} 
              step={1} 
              value={[rotation]} 
              onValueChange={onRotationChange}
            />
          </div>
        </div>
        
        <DialogFooter className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleCropImage}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}