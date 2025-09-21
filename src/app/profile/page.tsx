
"use client"

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { CameraCapture } from "@/components/camera-capture";
import { Upload, Camera as CameraIcon, Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState<string | null>("user@example.com");
  const [profileImage, setProfileImage] = useState<string>("https://picsum.photos/seed/1/200/200");
  const [isCaptureModalOpen, setCaptureModalOpen] = useState(false);
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = (dataUri: string) => {
    setProfileImage(dataUri);
    setCaptureModalOpen(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleUpload = () => {
    if (uploadedImage) {
        setProfileImage(uploadedImage);
        setUploadModalOpen(false);
        setUploadedImage(null);
    }
  }

  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background p-4 sm:p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Manage Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <div className="relative">
            <Avatar className="h-48 w-48 rounded-lg">
              <AvatarImage src={profileImage} alt="User avatar" className="rounded-lg object-cover" data-ai-hint="profile picture" />
              <AvatarFallback className="rounded-lg text-4xl">
                {userEmail?.[0]?.toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-sm">
            <Button onClick={() => setCaptureModalOpen(true)}>
                <CameraIcon className="mr-2" /> Capture Photo
            </Button>
            <Button variant="outline" onClick={() => setUploadModalOpen(true)}>
                <Upload className="mr-2" /> Upload Photo
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button>
            <Save className="mr-2" /> Save Changes
          </Button>
          <Button variant="outline">
            Cancel
          </Button>
        </CardFooter>
      </Card>

      {/* Capture Photo Modal */}
      <Dialog open={isCaptureModalOpen} onOpenChange={setCaptureModalOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Capture New Profile Photo</DialogTitle>
             <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>
          <CameraCapture 
            onCapture={handleCapture}
            captureLabel="Use this photo"
          />
          <DialogFooter>
            <div className="flex justify-center w-full">
                <Button variant="outline" onClick={() => setCaptureModalOpen(false)}>Cancel</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Upload Photo Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent>
           <DialogHeader>
            <DialogTitle>Upload New Profile Photo</DialogTitle>
             <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
              {uploadedImage ? (
                <div className="relative w-full h-full">
                    <Image src={uploadedImage} alt="Image preview" layout="fill" objectFit="contain" className="rounded-lg"/>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>Image preview will appear here.</p>
                </div>
              )}
            </div>
            <Input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/gif"
             />
             <Button variant="outline" className="w-full" onClick={triggerFileSelect}>
                <Upload className="mr-2"/>
                Choose Image
            </Button>
          </div>
           <DialogFooter className="!justify-between">
                <Button variant="outline" onClick={() => setUploadModalOpen(false)}>Cancel</Button>
                <Button onClick={handleUpload} disabled={!uploadedImage}>
                    <Save className="mr-2"/>
                    Use this image
                </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

