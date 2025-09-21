
"use client"

import { useState, useRef, useCallback } from "react";
import Cropper from 'react-easy-crop'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { CameraCapture } from "@/components/camera-capture";
import { Upload, Camera as CameraIcon, Save, X, ShieldAlert, Trash2, CalendarIcon, Crop, RefreshCw, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import getCroppedImg from "@/lib/crop-image";
import type { Area } from 'react-easy-crop';


export default function TeacherProfilePage() {
  const [userEmail, setUserEmail] = useState<string | null>("teacher@example.com");
  const [profileImage, setProfileImage] = useState<string>("https://picsum.photos/seed/3/200/200");
  const [isCaptureModalOpen, setCaptureModalOpen] = useState(false);
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState<Date>()
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

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
        setZoom(1);
        setCrop({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleUpload = useCallback(async () => {
    if (uploadedImage && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(uploadedImage, croppedAreaPixels);
        setProfileImage(croppedImage!);
        setUploadModalOpen(false);
        setUploadedImage(null);
      } catch (e) {
        console.error(e);
      }
    }
  }, [uploadedImage, croppedAreaPixels]);

  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background p-4 sm:p-6">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl font-bold">Manage Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-8">
          <div className="relative">
            <Avatar className="h-32 w-32 sm:h-48 sm:w-48 rounded-lg">
              <AvatarImage src={profileImage} alt="User avatar" className="rounded-lg object-cover" data-ai-hint="profile picture" />
              <AvatarFallback className="rounded-lg text-4xl">
                {userEmail?.[0]?.toUpperCase() ?? 'T'}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-sm">
            <Button onClick={() => setCaptureModalOpen(true)}>
                <CameraIcon className="mr-2 h-4 w-4" /> Capture Photo
            </Button>
            <Button variant="outline" onClick={() => setUploadModalOpen(true)}>
                <Upload className="mr-2 h-4 w-4" /> Upload Photo
            </Button>
          </div>

          <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue="Teacher User" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" defaultValue="Teacher" disabled />
              </div>
              <div className="grid gap-2">
                <Label>Gender</Label>
                <RadioGroup defaultValue="male" className="flex items-center space-x-4 pt-2">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female">Female</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="other" />
                        <Label htmlFor="other">Other</Label>
                    </div>
                </RadioGroup>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dob">Date of Birth</Label>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        captionLayout="dropdown-buttons"
                        fromYear={1950}
                        toYear={new Date().getFullYear()}
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        />
                    </PopoverContent>
                </Popover>
              </div>
               <div className="grid gap-2">
                <Label htmlFor="email">Mail ID</Label>
                <Input id="email" type="email" defaultValue={userEmail || ""} disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="alt-email">Alternative Mail ID</Label>
                <Input id="alt-email" type="email" placeholder="alt@example.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="+1 111 222 333" />
              </div>
               <div className="grid gap-2">
                <Label htmlFor="institution">Institution Name</Label>
                <Input id="institution" defaultValue="Global Tech Academy" disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" defaultValue="Computer Science" disabled />
              </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-center gap-4">
            <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-sm">
                <Button className="w-full sm:w-auto">
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
                <Button variant="outline" className="w-full sm:w-auto">
                    Cancel
                </Button>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4 pt-4 border-t w-full max-w-sm">
                <Button variant="secondary" className="w-full sm:w-auto">Change Password</Button>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="destructive" className="w-full sm:w-auto">
                            <Trash2 className="mr-2 h-4 w-4"/> Delete Account
                        </Button>
                    </DialogTrigger>
                     <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2"><ShieldAlert/>Are you absolutely sure?</DialogTitle>
                            <DialogDescription>
                                This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                            </DialogDescription>
                        </DialogHeader>
                         <Alert variant="destructive">
                            <AlertTitle>Warning</AlertTitle>
                            <AlertDescription>
                                To confirm, please type <strong>DELETE</strong> in the box below.
                            </AlertDescription>
                        </Alert>
                        <Input 
                            id="delete-confirm" 
                            placeholder='Type "DELETE" to confirm'
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                         />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button
                                variant="destructive"
                                disabled={deleteConfirmation !== 'DELETE'}
                            >
                                I understand, delete my account
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </CardFooter>
      </Card>

      {/* Capture Photo Modal */}
      <Dialog open={isCaptureModalOpen} onOpenChange={setCaptureModalOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Capture New Profile Photo</DialogTitle>
          </DialogHeader>
          <CameraCapture onCapture={handleCapture} />
        </DialogContent>
      </Dialog>
      
      {/* Upload Photo Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent>
           <DialogHeader>
            <DialogTitle>Upload & Crop Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative h-64 w-full bg-muted rounded-lg">
              {uploadedImage ? (
                <Cropper
                  image={uploadedImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  cropShape="round"
                  showGrid={false}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                  <p>Image preview will appear here.</p>
                </div>
              )}
            </div>
             {uploadedImage && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="zoom" className="text-right">Zoom</Label>
                <Slider
                  id="zoom"
                  min={1}
                  max={3}
                  step={0.1}
                  value={[zoom]}
                  onValueChange={(value) => setZoom(value[0])}
                  className="col-span-3"
                />
              </div>
            )}
            <Input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                onChange={handleFileChange}
                accept="image/png, image/jpeg"
             />
             <Button variant="outline" className="w-full" onClick={triggerFileSelect}>
                <Upload className="mr-2 h-4 w-4"/>
                Choose Image
            </Button>
          </div>
           <DialogFooter className="!justify-between flex-col-reverse sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setUploadModalOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                <Button onClick={handleUpload} disabled={!uploadedImage} className="w-full sm:w-auto">
                    <Crop className="mr-2 h-4 w-4"/>
                    Crop & Save
                </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
