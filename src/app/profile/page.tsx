
"use client";

import { useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

const profileUpdateSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  newPassword: z.string().optional(),
  confirmNewPassword: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileUpdateSchema>;

export default function ProfilePage() {
  const { currentUser, loading: authLoading, updateProfileDisplayName, updateUserPasswordInAuth } = useAuth();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setError, clearErrors } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      fullName: currentUser?.displayName || "",
      newPassword: "",
      confirmNewPassword: "",
    }
  });

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
    if (currentUser) {
      reset({ fullName: currentUser.displayName || "" });
    }
  }, [currentUser, authLoading, router, reset]);

  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    clearErrors(); // Clear previous errors
    if (!currentUser) {
      toast({ title: "Error", description: "Not authenticated.", variant: "destructive" });
      return;
    }

    setIsUpdating(true);
    let nameUpdated = false;
    let passwordUpdated = false;
    let updateFailed = false;

    // Update display name if changed
    if (data.fullName !== currentUser.displayName) {
      const success = await updateProfileDisplayName(data.fullName);
      if (success) {
        nameUpdated = true;
      } else {
        updateFailed = true;
      }
    }

    // Update password if new password is provided
    if (data.newPassword) {
      if (data.newPassword.length < 6) {
        setError("newPassword", { type: "manual", message: "New password must be at least 6 characters." });
        updateFailed = true;
      } else if (data.newPassword !== data.confirmNewPassword) {
        setError("confirmNewPassword", { type: "manual", message: "Passwords do not match." });
        updateFailed = true;
      } else {
        const success = await updateUserPasswordInAuth(data.newPassword);
        if (success) {
          passwordUpdated = true;
          reset({ ...data, newPassword: "", confirmNewPassword: "" }); // Clear password fields on success
        } else {
          // Error toast is handled by updateUserPasswordInAuth
          updateFailed = true;
        }
      }
    }
    
    setIsUpdating(false);

    if (!updateFailed && (nameUpdated || passwordUpdated)) {
        if (nameUpdated && passwordUpdated) {
            toast({ title: "Success", description: "Profile and password updated." });
        } else if (nameUpdated) {
            toast({ title: "Success", description: "Profile name updated." });
        } else if (passwordUpdated) {
             // Toast for password success already handled by updateUserPasswordInAuth
        }
    } else if (!nameUpdated && !passwordUpdated && !data.newPassword && data.fullName === currentUser.displayName) {
        toast({ title: "No Changes", description: "No changes were made to your profile." });
    }
  };
  
  if (authLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Account Settings</CardTitle>
          <CardDescription>Update your profile information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={currentUser?.email || ""} disabled className="mt-1" />
              <p className="text-sm text-muted-foreground mt-1">Email address cannot be changed.</p>
            </div>
            
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" {...register("fullName")} className="mt-1" />
              {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>}
            </div>

            <Separator />

            <h3 className="text-lg font-medium">Change Password</h3>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" {...register("newPassword")} className="mt-1" placeholder="Leave blank to keep current password"/>
              {errors.newPassword && <p className="text-sm text-destructive mt-1">{errors.newPassword.message}</p>}
            </div>
            <div>
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input id="confirmNewPassword" type="password" {...register("confirmNewPassword")} className="mt-1" />
              {errors.confirmNewPassword && <p className="text-sm text-destructive mt-1">{errors.confirmNewPassword.message}</p>}
            </div>
            
            <Button type="submit" className="w-full" disabled={isUpdating}>
              {isUpdating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
         <CardFooter>
            <Button variant="link" onClick={() => router.push('/')} className="w-full">
                Back to Chat
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
