

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/hooks/use-user-profile";
import { getInstitutions, addClassroomPhoto, deleteClassroomPhoto, embedPhotos } from "@/services/institution-service";
import { uploadImage } from "@/services/user-service";
import type { Department, ClassroomPhoto } from "@/lib/types";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { CameraCapture } from "@/components/camera-capture";
import { Upload, Camera as CameraIcon, ImageOff, Loader2, Save, Trash2, CheckCircle, HelpCircle, Cpu } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type PhotoCategory = 'classroomPhotoUrls' | 'studentsInClassroomPhotoUrls';

const PhotoUploadSection = ({
  title,
  description,
  photos,
  onUploadClick,
  onCaptureClick,
  onDeleteClick,
  onEmbedClick,
  isUploading,
  isEmbedding,
  category,
}: {
  title: string;
  description: string;
  photos?: ClassroomPhoto[];
  onUploadClick: () => void;
  onCaptureClick: () => void;
  onDeleteClick: (category: PhotoCategory, photo: ClassroomPhoto) => void;
  onEmbedClick: () => void;
  isUploading: boolean;
  isEmbedding: boolean;
  category: PhotoCategory;
}) => {
  const hasNewPhotos = useMemo(() => photos?.some(p => !p.embedded), [photos]);
  const validPhotos = useMemo(() => photos?.filter(p => p && p.url), [photos]);

  return (
  <Card>
    <CardHeader className="flex flex-row items-start justify-between">
      <div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      <Button size="sm" onClick={onEmbedClick} disabled={isEmbedding || !hasNewPhotos}>
        <Cpu className={cn("mr-2 h-4 w-4", isEmbedding && "animate-spin")} />
        {isEmbedding ? 'Generating...' : 'Generate Embedding'}
      </Button>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="relative w-full rounded-md border-dashed border-2 bg-muted overflow-hidden min-h-[200px]">
        {isUploading ? (
          <div className="absolute inset-0 w-full flex flex-col items-center gap-2 justify-center text-muted-foreground bg-black/50 z-20">
            <Loader2 className="animate-spin h-8 w-8" />
            <span>Processing...</span>
          </div>
        ) : null}

        {validPhotos && validPhotos.length > 0 ? (
          <ScrollArea className="h-64 w-full">
            <div className="grid grid-cols-4 gap-2 p-2">
              {validPhotos.map((photo, index) => (
                <div key={index} className="relative group aspect-square">
                   <Image src={photo.url} alt={`${title} ${index + 1}`} fill className="object-cover rounded-md" data-ai-hint="classroom" />
                    <div className={cn("absolute inset-0 rounded-md border-4", photo.embedded ? "border-green-500" : "border-transparent")}></div>
                    {photo.embedded && <CheckCircle className="absolute top-1 left-1 h-5 w-5 text-white bg-green-500 rounded-full p-0.5" />}
                   <AlertDialogTrigger asChild>
                    <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={() => onDeleteClick(category, photo)}>
                        <Trash2 className="h-3 w-3" />
                    </Button>
                   </AlertDialogTrigger>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="h-64 w-full flex flex-col items-center gap-2 justify-center text-muted-foreground">
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
};

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
  const [isEmbedding, setIsEmbedding] = useState<PhotoCategory | null>(null);
  
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ photo: ClassroomPhoto; category: PhotoCategory } | null>(null);
  
  const selectedDepartment = useMemo(() => departments.find(d => d.id === selectedDepartmentId), [departments, selectedDepartmentId]);

  useEffect(() => {
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

  const handleFileUpload = (file: File) => {
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
      
      const newPhoto: ClassroomPhoto = { url: imageUrl, embedded: false };

      setDepartments(prev => prev.map(d => 
        d.id === selectedDepartmentId 
        ? {...d, [activePhotoCategory]: [...(d[activePhotoCategory] || []), newPhoto]} 
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
    if (!deleteTarget || !userProfile?.institutionId || !selectedDepartmentId) return;

    const { photo, category } = deleteTarget;
    setIsUploading(true);
    try {
      await deleteClassroomPhoto(userProfile.institutionId, selectedDepartmentId, category, photo);
      
      setDepartments(prev => prev.map(d => {
        if (d.id === selectedDepartmentId) {
            const updatedUrls = (d[category] || []).filter((p: ClassroomPhoto) => p.url !== photo.url);
            return {...d, [category]: updatedUrls};
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

  const onDeleteClick = (category: PhotoCategory, photo: ClassroomPhoto) => {
    setDeleteTarget({ photo, category });
  };

  const handleEmbed = async (category: PhotoCategory) => {
    if (!userProfile?.institutionId || !selectedDepartmentId) return;
    setIsEmbedding(category);
    try {
      const updatedPhotos = await embedPhotos(userProfile.institutionId, selectedDepartmentId, category);
      
      setDepartments(prev => prev.map(d => 
        d.id === selectedDepartmentId ? { ...d, [category]: updatedPhotos } : d
      ));

      toast({ title: "Success", description: "New photos have been processed for embedding." });

    } catch (error) {
      console.error(error);
      toast({ title: "Embedding Failed", description: "Could not process the photos.", variant: "destructive" });
    } finally {
      setIsEmbedding(null);
    }
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
    <>
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
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
      </AlertDialog>
        
      <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Classroom Photo Configuration</h1>
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
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
        <Card className="p-3 max-w-md">
            <CardHeader className="p-1 pb-2">
                <CardTitle className="text-base flex items-center gap-2"><HelpCircle className="h-4 w-4"/>Legend</CardTitle>
            </CardHeader>
            <CardContent className="p-1 text-sm space-y-1 text-muted-foreground">
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500"/><span>Photo is part of the embedding.</span></div>
                <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-full border-2 border-dashed"></div><span>New photo, not yet embedded.</span></div>
            </CardContent>
        </Card>
      </div>

      {selectedDepartmentId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PhotoUploadSection
              title="Classroom View"
              description="Images of the empty classroom."
              photos={selectedDepartment?.classroomPhotoUrls}
              onUploadClick={() => onUploadClick('classroomPhotoUrls')}
              onCaptureClick={() => onCaptureClick('classroomPhotoUrls')}
              onDeleteClick={onDeleteClick}
              onEmbedClick={() => handleEmbed('classroomPhotoUrls')}
              isUploading={isUploading && activePhotoCategory === 'classroomPhotoUrls'}
              isEmbedding={isEmbedding === 'classroomPhotoUrls'}
              category="classroomPhotoUrls"
          />
          <PhotoUploadSection
              title="Classroom with Students"
              description="Images of the classroom with students present."
              photos={selectedDepartment?.studentsInClassroomPhotoUrls}
              onUploadClick={() => onUploadClick('studentsInClassroomPhotoUrls')}
              onCaptureClick={() => onCaptureClick('studentsInClassroomPhotoUrls')}
              onDeleteClick={onDeleteClick}
              onEmbedClick={() => handleEmbed('studentsInClassroomPhotoUrls')}
              isUploading={isUploading && activePhotoCategory === 'studentsInClassroomPhotoUrls'}
              isEmbedding={isEmbedding === 'studentsInClassroomPhotoUrls'}
              category="studentsInClassroomPhotoUrls"
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
      
      </div>
    </>
  );
}




    