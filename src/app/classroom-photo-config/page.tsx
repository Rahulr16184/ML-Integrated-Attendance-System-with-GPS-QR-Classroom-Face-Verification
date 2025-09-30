"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/hooks/use-user-profile";
import { getInstitutions, updateClassroomPhoto } from "@/services/institution-service";
import { uploadImage } from "@/services/user-service";
import type { Department } from "@/lib/types";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CameraCapture } from "@/components/camera-capture";
import { Upload, Camera as CameraIcon, ImageOff, Loader2 } from "lucide-react";

type PhotoCategory = 'classroomPhotoUrl' | 'studentsInClassroomPhotoUrl';

const PhotoUploadSection = ({
  title,
  description,
  imageUrl,
  onUploadClick,
  onCaptureClick,
  isUploading,
}: {
  title: string;
  description: string;
  imageUrl?: string | null;
  onUploadClick: () => void;
  onCaptureClick: () => void;
  isUploading: boolean;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="aspect-video w-full rounded-md border-dashed border-2 flex items-center justify-center bg-muted overflow-hidden">
        {isUploading ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="animate-spin h-8 w-8" />
            <span>Uploading...</span>
          </div>
        ) : imageUrl ? (
          <Image src={imageUrl} alt={title} width={640} height={360} className="object-contain w-full h-full" data-ai-hint="classroom" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageOff className="h-10 w-10" />
            <span>No image uploaded</span>
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

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const [activePhotoCategory, setActivePhotoCategory] = useState<PhotoCategory | null>(null);
  const [isUploading, setIsUploading] = useState<Record<PhotoCategory, boolean>>({ classroomPhotoUrl: false, studentsInClassroomPhotoUrl: false });
  const [isCaptureModalOpen, setCaptureModalOpen] = useState(false);
  
  const selectedDepartment = departments.find(d => d.id === selectedDepartmentId);

  useEffect(() => {
    const role = localStorage.getItem("userRole") || sessionStorage.getItem("userRole");
    if (role !== 'admin' && role !== 'teacher') {
      router.push('/login');
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  useEffect(() => {
    async function fetchDepartments() {
      if (userProfile?.institutionId && userProfile.departmentIds) {
        setLoadingDepartments(true);
        const institutions = await getInstitutions();
        const currentInstitution = institutions.find(inst => inst.id === userProfile.institutionId);
        if (currentInstitution) {
          const userDepartments = currentInstitution.departments.filter(d => userProfile.departmentIds?.includes(d.id));
          setDepartments(userDepartments);
          if (userDepartments.length > 0 && !selectedDepartmentId) {
            setSelectedDepartmentId(userDepartments[0].id);
          }
        }
        setLoadingDepartments(false);
      }
    }
    if (isAuthorized && !userLoading) {
      fetchDepartments();
    }
  }, [userProfile, userLoading, isAuthorized, selectedDepartmentId]);

  const handleFileUpload = async (file: File) => {
    if (!activePhotoCategory || !userProfile?.institutionId || !selectedDepartmentId) return;

    setIsUploading(prev => ({...prev, [activePhotoCategory!]: true}));
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
          const dataUri = reader.result as string;
          const imageUrl = await uploadImage(dataUri);
          await updateClassroomPhoto(userProfile.institutionId, selectedDepartmentId, activePhotoCategory, imageUrl);
          
          setDepartments(prev => prev.map(d => d.id === selectedDepartmentId ? {...d, [activePhotoCategory]: imageUrl} : d));

          toast({ title: "Success", description: "Photo uploaded successfully." });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Upload Failed", description: "Could not upload the image.", variant: "destructive" });
    } finally {
      setIsUploading(prev => ({...prev, [activePhotoCategory!]: false}));
      setActivePhotoCategory(null);
    }
  };

  const handleCapture = async (dataUri: string) => {
    setCaptureModalOpen(false);
    if (!activePhotoCategory || !userProfile?.institutionId || !selectedDepartmentId) return;

    setIsUploading(prev => ({...prev, [activePhotoCategory!]: true}));
    try {
      const imageUrl = await uploadImage(dataUri);
      await updateClassroomPhoto(userProfile.institutionId, selectedDepartmentId, activePhotoCategory, imageUrl);
      
      setDepartments(prev => prev.map(d => d.id === selectedDepartmentId ? {...d, [activePhotoCategory]: imageUrl} : d));

      toast({ title: "Success", description: "Photo saved successfully." });
    } catch (error) {
      console.error(error);
      toast({ title: "Save Failed", description: "Could not save the captured image.", variant: "destructive" });
    } finally {
      setIsUploading(prev => ({...prev, [activePhotoCategory!]: false}));
      setActivePhotoCategory(null);
    }
  };

  const onUploadClick = (category: PhotoCategory) => {
    setActivePhotoCategory(category);
    fileInputRef.current?.click();
  };
  
  const onCaptureClick = (category: PhotoCategory) => {
    setActivePhotoCategory(category);
    setCaptureModalOpen(true);
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
            description="An image of the empty classroom."
            imageUrl={selectedDepartment?.classroomPhotoUrl}
            onUploadClick={() => onUploadClick('classroomPhotoUrl')}
            onCaptureClick={() => onCaptureClick('classroomPhotoUrl')}
            isUploading={isUploading.classroomPhotoUrl}
          />
          <PhotoUploadSection
            title="Classroom with Students"
            description="An image of the classroom with students present."
            imageUrl={selectedDepartment?.studentsInClassroomPhotoUrl}
            onUploadClick={() => onUploadClick('studentsInClassroomPhotoUrl')}
            onCaptureClick={() => onCaptureClick('studentsInClassroomPhotoUrl')}
            isUploading={isUploading.studentsInClassroomPhotoUrl}
          />
        </div>
      ) : (
        <Card className="mt-6">
            <CardContent className="pt-6 text-center text-muted-foreground">
                <p>Please select a department to configure classroom photos.</p>
            </CardContent>
        </Card>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/png, image/jpeg"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
      />
      
      {/* Capture Photo Modal */}
      <Dialog open={isCaptureModalOpen} onOpenChange={setCaptureModalOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Capture Classroom Photo</DialogTitle>
          </DialogHeader>
          <CameraCapture onCapture={handleCapture} captureLabel="Use this photo" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
