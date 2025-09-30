
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/hooks/use-user-profile";
import { getInstitutions, addClassroomPhoto, deleteClassroomPhoto } from "@/services/institution-service";
import { uploadImage } from "@/services/user-service";
import type { Department } from "@/lib/types";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { CameraCapture } from "@/components/camera-capture";
import { Upload, Camera as CameraIcon, ImageOff, Loader2, Save, Trash2, X } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type PhotoCategory = 'classroomPhotoUrls' | 'studentsInClassroomPhotoUrls';

const PhotoUploadSection = ({
  title,
  description,
  imageUrls,
  onUploadClick,
  onCaptureClick,
  onDeleteClick,
  isUploading,
}: {
  title: string;
  description: string;
  imageUrls?: string[];
  onUploadClick: () => void;
  onCaptureClick: () => void;
  onDeleteClick: (url: string) => void;
  isUploading: boolean;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="relative w-full rounded-md border-dashed border-2 flex items-center justify-center bg-muted overflow-hidden">
        {isUploading ? (
          <div className="aspect-video w-full flex flex-col items-center gap-2 justify-center text-muted-foreground">
            <Loader2 className="animate-spin h-8 w-8" />
            <span>Processing...</span>
          </div>
        ) : imageUrls && imageUrls.length > 0 ? (
          <Carousel className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
            <CarouselContent>
              {imageUrls.map((url, index) => (
                <CarouselItem key={index} className="relative aspect-video">
                  <Image src={url} alt={`${title} ${index + 1}`} fill className="object-contain" data-ai-hint="classroom" />
                   <AlertDialogTrigger asChild>
                      <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-7 w-7" onClick={() => onDeleteClick(url)}>
                          <Trash2 className="h-4 w-4" />
                      </Button>
                  </AlertDialogTrigger>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        ) : (
          <div className="aspect-video w-full flex flex-col items-center gap-2 justify-center text-muted-foreground">
            <ImageOff className="h-10 w-10" />
            <span>No images uploaded</span>
          </div>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button onClick={onCaptureClick} className="w-full">
          <CameraIcon className="mr-2 h-4 w-4" /> Capture
        </Button>
        <Button onClick={onUploadClick} variant="outline" className="w-full">
          <Upload className="mr-2 h-4 w-4" /> Upload
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default function ClassroomPhotoConfigPage() {
  const router = useRouter();
  const { userProfile, loading: userLoading } = useUserProfile();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const [activePhotoCategory, setActivePhotoCategory] = useState<PhotoCategory | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  
  const selectedDepartment = useMemo(() => departments.find(d => d.id === selectedDepartmentId), [departments, selectedDepartmentId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const referrer = document.referrer;
        const validReferrers = ['/admin-dashboard', '/teacher-dashboard'];
        const isFromDashboard = validReferrers.some(path => referrer.endsWith(path));

        if (!isFromDashboard) {
            router.push('/login');
            return;
        }
    }

    async function fetchInitialData() {
        if (userLoading) return;
        if (!userProfile) {
          router.push('/login');
          return;
        }
        if (userProfile.role !== 'admin' && userProfile.role !== 'teacher') {
          router.push('/login');
          return;
        }
        
        if (userProfile?.institutionId && userProfile.departmentIds) {
            setLoadingDepartments(true);
            try {
                const institutions = await getInstitutions();
                const currentInstitution = institutions.find(inst => inst.id === userProfile.institutionId);
                if (currentInstitution) {
                    const userDepartments = currentInstitution.departments.filter(d => userProfile.departmentIds?.includes(d.id));
                    setDepartments(userDepartments);
                    if (userDepartments.length > 0 && !selectedDepartmentId) {
                        setSelectedDepartmentId(userDepartments[0].id);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch departments", error);
                toast({ title: "Error", description: "Could not fetch departments.", variant: "destructive" });
            } finally {
                setLoadingDepartments(false);
            }
        } else {
            setLoadingDepartments(false);
        }
    }
    fetchInitialData();
  }, [userProfile, userLoading, router, toast]);


  const handleImageSelected = (dataUri: string, category: PhotoCategory) => {
    setActivePhotoCategory(category);
    setPreviewImage(dataUri);
  }

  const handleFileUpload = async (file: File) => {
    if (!activePhotoCategory) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
        handleImageSelected(reader.result as string, activePhotoCategory);
    }
  };

  const handleConfirmSave = async () => {
    if (!previewImage || !activePhotoCategory || !userProfile?.institutionId || !selectedDepartmentId) return;

    setIsUploading(true);
    setPreviewImage(null);

    try {
      const imageUrl = await uploadImage(previewImage);
      await addClassroomPhoto(userProfile.institutionId, selectedDepartmentId, activePhotoCategory, imageUrl);
      
      setDepartments(prev => prev.map(d => 
        d.id === selectedDepartmentId 
        ? {...d, [activePhotoCategory]: [...(d[activePhotoCategory] || []), imageUrl]} 
        : d
      ));

      toast({ title: "Success", description: "Photo uploaded successfully." });
    } catch (error) {
      console.error(error);
      toast({ title: "Save Failed", description: "Could not save the image.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      setActivePhotoCategory(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !activePhotoCategory || !userProfile?.institutionId || !selectedDepartmentId) return;

    setIsUploading(true);
    try {
      await deleteClassroomPhoto(userProfile.institutionId, selectedDepartmentId, activePhotoCategory, deleteTarget);
      
      setDepartments(prev => prev.map(d => {
        if (d.id === selectedDepartmentId) {
            const updatedUrls = (d[activePhotoCategory] || []).filter((url: string) => url !== deleteTarget);
            return {...d, [activePhotoCategory]: updatedUrls};
        }
        return d;
      }));

      toast({ title: "Success", description: "Photo deleted successfully." });
    } catch (error) {
        console.error(error);
        toast({ title: "Delete Failed", description: "Could not delete the image.", variant: "destructive" });
    } finally {
        setIsUploading(false);
        setDeleteTarget(null);
        setActivePhotoCategory(null);
    }
  };

  const onUploadClick = (category: PhotoCategory) => {
    setActivePhotoCategory(category);
    fileInputRef.current?.click();
  };
  
  const onCaptureClick = (category: PhotoCategory) => {
    setActivePhotoCategory(category);
    setPreviewImage('capture'); // Special value to trigger camera modal
  };

  const onDeleteClick = (category: PhotoCategory, url: string) => {
    setActivePhotoCategory(category);
    setDeleteTarget(url);
  };
  
  if (userLoading || loadingDepartments) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <div className="p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Classroom Photo Configuration</h1>
        <div className="max-w-md space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select onValueChange={setSelectedDepartmentId} value={selectedDepartmentId} disabled={departments.length === 0}>
            <SelectTrigger id="department">
                <SelectValue placeholder="Select a department" />
            </SelectTrigger>
            <SelectContent>
                {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>

        {selectedDepartmentId ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PhotoUploadSection
                title="Classroom View"
                description="Images of the empty classroom."
                imageUrls={selectedDepartment?.classroomPhotoUrls}
                onUploadClick={() => onUploadClick('classroomPhotoUrls')}
                onCaptureClick={() => onCaptureClick('classroomPhotoUrls')}
                onDeleteClick={(url) => onDeleteClick('classroomPhotoUrls', url)}
                isUploading={isUploading && activePhotoCategory === 'classroomPhotoUrls'}
            />
            <PhotoUploadSection
                title="Classroom with Students"
                description="Images of the classroom with students present."
                imageUrls={selectedDepartment?.studentsInClassroomPhotoUrls}
                onUploadClick={() => onUploadClick('studentsInClassroomPhotoUrls')}
                onCaptureClick={() => onCaptureClick('studentsInClassroomPhotoUrls')}
                onDeleteClick={(url) => onDeleteClick('studentsInClassroomPhotoUrls', url)}
                isUploading={isUploading && activePhotoCategory === 'studentsInClassroomPhotoUrls'}
            />
            </div>
        ) : (
            <Card className="mt-6">
                <CardContent className="pt-6 text-center text-muted-foreground">
                    <p>Please select a department to configure classroom photos.</p>
                </CardContent>
            </Card>
        )}

        <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/png, image/jpeg"
            onChange={(e) => {
            if (e.target.files?.[0]) {
                handleFileUpload(e.target.files[0]);
            }
            e.target.value = ''; // Reset the input
            }}
        />
        
        {/* Capture or Preview Modal */}
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
            <DialogContent className="sm:max-w-[625px]">
                {previewImage === 'capture' ? (
                     <>
                        <DialogHeader>
                            <DialogTitle>Capture Classroom Photo</DialogTitle>
                        </DialogHeader>
                        <CameraCapture onCapture={(dataUri) => handleImageSelected(dataUri, activePhotoCategory!)} captureLabel="Use this photo" />
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Confirm Photo</DialogTitle>
                            <DialogDescription>Do you want to save this photo?</DialogDescription>
                        </DialogHeader>
                        <div className="relative aspect-video w-full rounded-md bg-muted overflow-hidden my-4">
                            {previewImage && <Image src={previewImage} alt="Preview" fill className="object-contain"/>}
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button onClick={handleConfirmSave}><Save className="mr-2 h-4 w-4" />Save Photo</Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the photo.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>

        </div>
    </AlertDialog>
  );
}

    