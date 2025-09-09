# Virukshaa-Construction-product
















-------------------------------
// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import * as z from 'zod';
// import { Button } from '@/components/ui/button';
// import { Input } from "@/components/ui/input"
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
// import { useToast } from '@/components/ui/use-toast';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Loader2, Upload, Edit, Save, X, Pencil, Link } from 'lucide-react';
// import { FormDescription } from "@/components/ui/form";

// // Define form schema using Zod
// const formSchema = z.object({
//   companyName: z.string().min(2, {
//     message: 'Company name must be at least 2 characters.',
//   }),
//   adminName: z.string().min(2, {
//     message: 'Name must be at least 2 characters.',
//   }),
//   email: z.string().email({
//     message: 'Please enter a valid email address.',
//   }),
//   currentPassword: z.string().optional(),
//   newPassword: z.string().min(8, {
//     message: 'Password must be at least 8 characters long.',
//   }).optional().or(z.literal('')),
//   confirmPassword: z.string().optional(),
//   logo: z.any().optional(),
// }).refine((data) => {
//   if (data.newPassword) {
//     return data.newPassword === data.confirmPassword;
//   }
//   return true;
// }, {
//   message: "Passwords don't match",
//   path: ["confirmPassword"],
// });

// type FormValues = z.infer<typeof formSchema>;

// const AdminSetting = () => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [previewUrl, setPreviewUrl] = useState<string>('');
//   const [logoUrl, setLogoUrl] = useState<string>('');
//   const [showUrlInput, setShowUrlInput] = useState(false);
//   const [profileData, setProfileData] = useState<any>(null);
//   const { toast } = useToast();

//   const form = useForm<FormValues>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       companyName: '',
//       adminName: '',
//       email: '',
//       currentPassword: '',
//       newPassword: '',
//       confirmPassword: '',
//     },
//   });

//   // Load admin data on component mount
//   useEffect(() => {
//     const fetchAdminData = async () => {
//       try {
//         console.log('Fetching admin data...');
//         setIsLoading(true);
        
//         // Include credentials to send cookies with the request
//         const response = await fetch('/api/admin/profile', {
//           credentials: 'include', // This is important for sending cookies
//           headers: {
//             'Content-Type': 'application/json',
//           },
//         });
        
//         const data = await response.json();
        
//         if (!response.ok) {
//           console.error('Error response from API:', data);
//           // If unauthorized, redirect to login or show login prompt
//           if (response.status === 401) {
//             window.location.href = '/auth/signin';
//             return;
//           }
//           throw new Error(data.error || 'Failed to fetch admin data');
//         }
        
//         console.log('Fetched admin data:', data);
        
//         setProfileData(data);
        
//         form.reset({
//           companyName: data.companyName || '',
//           adminName: data.adminName || '',
//           email: data.email || '',
//           currentPassword: '',
//           newPassword: '',
//           confirmPassword: '',
//         });
        
//         if (data.logo) {
//           setPreviewUrl(data.logo);
//         }
//       } catch (error) {
//         console.error('Error in fetchAdminData:', error);
//         toast({
//           title: 'Error',
//           description: error instanceof Error ? error.message : 'Failed to load admin data',
//           variant: 'destructive',
//         });
        
//         // Set default data if fetch fails
//         const defaultData = {
//           companyName: 'My Company',
//           adminName: 'Admin',
//           email: 'admin@example.com',
//           logo: '',
//         };
        
//         setProfileData(defaultData);
//         form.reset({
//           ...defaultData,
//           currentPassword: '',
//           newPassword: '',
//           confirmPassword: '',
//         });
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchAdminData();
//   }, [form, toast]);

//   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     // Check file type (allow only images)
//     if (!file.type.match('image.*')) {
//       toast({
//         title: 'Invalid file type',
//         description: 'Please upload an image file (JPEG, PNG, etc.)',
//         variant: 'destructive',
//       });
//       return;
//     }

//     // Check file size (max 2MB)
//     if (file.size > 2 * 1024 * 1024) {
//       toast({
//         title: 'File too large',
//         description: 'Please upload an image smaller than 2MB',
//         variant: 'destructive',
//       });
//       return;
//     }

//     try {
//       setIsLoading(true);
      
//       // For local preview
//       const reader = new FileReader();
//       reader.onload = () => {
//         setPreviewUrl(reader.result as string);
//       };
//       reader.readAsDataURL(file);
      
//       // Update the profile data with the new logo
//       setProfileData((prev: any) => ({
//         ...prev,
//         logo: URL.createObjectURL(file),
//       }));
      
//       // Reset URL input state
//       setShowUrlInput(false);
//       setLogoUrl('');
      
//     } catch (error) {
//       console.error('Error processing logo:', error);
//       toast({
//         title: 'Error',
//         description: 'Failed to process logo',
//         variant: 'destructive',
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };
  
//   const handleUrlSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!logoUrl) return;
    
//     try {
//       // Basic URL validation
//       new URL(logoUrl);
      
//       setPreviewUrl(logoUrl);
//       setProfileData((prev: any) => ({
//         ...prev,
//         logo: logoUrl,
//       }));
      
//       toast({
//         title: 'Success',
//         description: 'Logo URL updated',
//       });
      
//       // Reset URL input state
//       setShowUrlInput(false);
//       setLogoUrl('');
      
//     } catch (error) {
//       toast({
//         title: 'Invalid URL',
//         description: 'Please enter a valid image URL',
//         variant: 'destructive',
//       });
//     }
//   };
  
//   const handleRemoveLogo = () => {
//     setPreviewUrl('');
//     setLogoUrl('');
//     setProfileData((prev: any) => ({
//       ...prev,
//       logo: '',
//     }));
//     setShowUrlInput(false);
//   };

//   const onSubmit = async (data: FormValues) => {
//     try {
//       setIsLoading(true);
      
//       const formData = new FormData();
//       formData.append('companyName', data.companyName);
//       formData.append('adminName', data.adminName);
//       const response = await fetch('/api/admin/profile', {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           companyName: data.companyName,
//           adminName: data.adminName,
//           email: data.email,
//           password: data.newPassword || undefined,
//         }),
//       });

//       const result = await response.json();
      
//       if (!response.ok) {
//         throw new Error(result.error || 'Failed to update profile');
//       }
      
//       // Update the profile data with the new values
//       setProfileData({
//         ...profileData,
//         companyName: data.companyName,
//         adminName: data.adminName,
//         email: data.email || profileData.email,
//         logo: result.data?.logo || profileData.logo,
//       });
      
//       // Update the preview URL if logo was updated
//       if (result.data?.logo) {
//         setPreviewUrl(result.data.logo);
//       }
      
//       toast({
//         title: 'Success',
//         description: 'Profile updated successfully',
//       });
      
//       // Clear password fields after successful update
//       if (data.newPassword) {
//         form.reset({
//           ...form.getValues(),
//           currentPassword: '',
//           newPassword: '',
//           confirmPassword: '',
//         });
//       }
      
//       // Exit edit mode
//       setIsEditing(false);
      
//       // Dispatch custom event to notify other components about the profile update
//       window.dispatchEvent(new Event('profileUpdated'));
//     } catch (error) {
//       console.error('Error updating profile:', error);
//       toast({
//         title: 'Error',
//         description: 'Failed to update profile',
//         variant: 'destructive',
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (!profileData) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <Loader2 className="h-8 w-8 animate-spin" />
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto py-8">
//       <div className="max-w-4xl mx-auto bg-gradient-to-br from-white to-gray-50 rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6 text-white">
//           <div className="flex items-center justify-between">
//             <div>
//               <h1 className="text-2xl font-bold">Admin Settings</h1>
//               <p className="text-blue-100">Manage your profile and company information</p>
//             </div>
//             {!isEditing ? (
//               <Button 
//                 variant="outline" 
//                 size="sm" 
//                 onClick={() => setIsEditing(true)}
//                 className="bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-sm"
//               >
//                 <Edit className="h-4 w-4 mr-2" />
//                 Edit Profile
//               </Button>
//             ) : (
//               <div className="flex gap-3">
//                 <Button 
//                   variant="outline" 
//                   size="sm" 
//                   onClick={() => {
//                     setIsEditing(false);
//                     form.reset({
//                       companyName: profileData.companyName || '',
//                       adminName: profileData.adminName || '',
//                       email: profileData.email || '',
//                       currentPassword: '',
//                       newPassword: '',
//                       confirmPassword: '',
//                     });
//                     setPreviewUrl(profileData.logo || '');
//                   }}
//                   disabled={isLoading}
//                   className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
//                 >
//                   <X className="h-4 w-4 mr-2" />
//                   Cancel
//                 </Button>
//                 <Button 
//                   size="sm" 
//                   onClick={form.handleSubmit(onSubmit)}
//                   disabled={isLoading}
//                   className="bg-white text-blue-700 hover:bg-blue-50"
//                 >
//                   {isLoading ? (
//                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                   ) : (
//                     <Save className="h-4 w-4 mr-2" />
//                   )}
//                   Save Changes
//                 </Button>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Content */}
//         <div className="p-8">
//           {!isEditing ? (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//               {/* Logo Section */}
//               <div className="space-y-6">
//                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//                   <h3 className="text-lg font-semibold text-gray-800 mb-4">Company Logo</h3>
//                   <div className="flex flex-col items-center">
//                     <div className="relative group">
//                       <label htmlFor="logo-upload" className="cursor-pointer">
//                         <input
//                           id="logo-upload"
//                           type="file"
//                           accept="image/*"
//                           className="hidden"
//                           onChange={handleFileChange}
//                           disabled={isLoading}
//                         />
//                         <div className="relative">
//                           <Avatar className="h-32 w-32 border-4 border-white shadow-lg group-hover:opacity-80 transition-opacity">
//                             <AvatarImage 
//                               src={previewUrl || '/default-logo.png'} 
//                               alt="Company Logo" 
//                               className="object-cover"
//                             />
//                             <AvatarFallback className="text-2xl font-bold bg-blue-100 text-blue-600">
//                               {profileData.companyName?.charAt(0) || 'C'}
//                             </AvatarFallback>
//                           </Avatar>
//                           <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
//                             <Pencil className="h-8 w-8 text-white" />
//                           </div>
//                         </div>
//                       </label>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Company Info */}
//                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//                   <h3 className="text-lg font-semibold text-gray-800 mb-4">Company Information</h3>
//                   <div className="space-y-3">
//                     <div>
//                       <p className="text-sm font-medium text-gray-500">Company Name</p>
//                       <p className="text-gray-800 font-medium">{profileData.companyName || 'Not set'}</p>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Admin Info */}
//               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//                 <h3 className="text-lg font-semibold text-gray-800 mb-6">Admin Information</h3>
//                 <div className="space-y-6">
//                   <div className="space-y-1">
//                     <p className="text-sm font-medium text-gray-500">Full Name</p>
//                     <p className="text-gray-800 font-medium">{profileData.adminName || 'Not set'}</p>
//                   </div>
//                   <div className="space-y-1">
//                     <p className="text-sm font-medium text-gray-500">Email Address</p>
//                     <p className="text-gray-800 font-medium">{profileData.email || 'Not set'}</p>
//                   </div>
//                   <div className="pt-4 border-t border-gray-100">
//                     <Button 
//                       variant="outline" 
//                       size="sm" 
//                       onClick={() => setIsEditing(true)}
//                       className="w-full"
//                     >
//                       <Edit className="h-4 w-4 mr-2" />
//                       Edit Profile
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ) : (
//             <Form {...form}>
//               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//                   {/* Left Column */}
//                   <div className="space-y-6">
//                     {/* Logo Upload */}
//                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//                       <h3 className="text-lg font-semibold text-gray-800 mb-4">Company Logo</h3>
//                       <div className="space-y-4">
//                         <div className="flex flex-col items-center">
//                           <div className="relative group mb-4">
//                             <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
//                               <AvatarImage 
//                                 src={previewUrl || profileData?.logo} 
//                                 alt="Company Logo" 
//                                 className="object-cover"
//                               />
//                               <AvatarFallback className="text-2xl font-bold bg-blue-100 text-blue-600">
//                                 {form.watch('companyName')?.charAt(0) || 'C'}
//                               </AvatarFallback>
//                             </Avatar>
//                             {(previewUrl || profileData?.logo) && (
//                               <button
//                                 onClick={handleRemoveLogo}
//                                 className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
//                                 type="button"
//                               >
//                                 <X className="h-4 w-4" />
//                               </button>
//                             )}
//                           </div>
                          
//                           {showUrlInput ? (
//                             <form onSubmit={handleUrlSubmit} className="w-full space-y-2">
//                               <div className="flex gap-2">
//                                 <Input
//                                   type="url"
//                                   placeholder="Enter image URL"
//                                   value={logoUrl}
//                                   onChange={(e) => setLogoUrl(e.target.value)}
//                                   className="flex-1"
//                                 />
//                                 <Button type="submit" size="sm" disabled={!logoUrl.trim() || isLoading}>
//                                   Save
//                                 </Button>
//                               </div>
//                               <Button
//                                 type="button"
//                                 variant="ghost"
//                                 size="sm"
//                                 className="text-xs"
//                                 onClick={() => setShowUrlInput(false)}
//                               >
//                                 Cancel
//                               </Button>
//                             </form>
//                           ) : (
//                             <div className="flex flex-col space-y-2 w-full">
//                               <div className="flex gap-2">
//                                 <input
//                                   type="file"
//                                   id="logo-upload"
//                                   accept="image/*"
//                                   className="hidden"
//                                   onChange={handleFileChange}
//                                 />
//                                 <label
//                                   htmlFor="logo-upload"
//                                   className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
//                                 >
//                                   <Upload className="h-4 w-4 mr-2" />
//                                   Upload
//                                 </label>
//                                 <Button
//                                   type="button"
//                                   variant="outline"
//                                   size="sm"
//                                   onClick={() => setShowUrlInput(true)}
//                                   className="flex-1"
//                                 >
//                                   <Link className="h-4 w-4 mr-2" />
//                                   URL
//                                 </Button>
//                               </div>
//                               <p className="text-xs text-gray-500 text-center">JPG, PNG, or WebP. Max 2MB</p>
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     </div>

//                     {/* Company Info */}
//                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//                       <h3 className="text-lg font-semibold text-gray-800 mb-6">Company Information</h3>
//                       <FormField
//                         control={form.control}
//                         name="companyName"
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormLabel>Company Name</FormLabel>
//                             <FormControl>
//                               <Input 
//                                 placeholder="Enter company name" 
//                                 {...field} 
//                                 className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                               />
//                             </FormControl>
//                             <FormMessage className="text-xs" />
//                           </FormItem>
//                         )}
//                       />
//                     </div>
//                   </div>

//                   {/* Right Column */}
//                   <div className="space-y-6">
//                     {/* Admin Info */}
//                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//                       <h3 className="text-lg font-semibold text-gray-800 mb-6">Admin Information</h3>
//                       <div className="space-y-4">
//                         <FormField
//                           control={form.control}
//                           name="adminName"
//                           render={({ field }) => (
//                             <FormItem>
//                               <FormLabel>Full Name</FormLabel>
//                               <FormControl>
//                                 <Input 
//                                   placeholder="Enter your full name" 
//                                   {...field} 
//                                   className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                                 />
//                               </FormControl>
//                               <FormMessage className="text-xs" />
//                             </FormItem>
//                           )}
//                         />
//                         <FormField
//                           control={form.control}
//                           name="email"
//                           render={({ field }) => (
//                             <FormItem>
//                               <FormLabel>Email Address</FormLabel>
//                               <FormControl>
//                                 <Input 
//                                   type="email" 
//                                   placeholder="Enter your email" 
//                                   {...field} 
//                                   className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                                 />
//                               </FormControl>
//                               <FormMessage className="text-xs" />
//                             </FormItem>
//                           )}
//                         />
//                       </div>
//                     </div>

//                     {/* Change Password */}
//                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//                       <h3 className="text-lg font-semibold text-gray-800 mb-6">Change Password</h3>
//                       <div className="space-y-4">
//                         <FormField
//                           control={form.control}
//                           name="currentPassword"
//                           render={({ field }) => (
//                             <FormItem>
//                               <FormLabel>Current Password</FormLabel>
//                               <FormControl>
//                                 <Input 
//                                   type="password" 
//                                   placeholder="Enter current password" 
//                                   {...field} 
//                                   className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                                 />
//                               </FormControl>
//                               <FormMessage className="text-xs" />
//                             </FormItem>
//                           )}
//                         />
//                         <FormField
//                           control={form.control}
//                           name="newPassword"
//                           render={({ field }) => (
//                             <FormItem>
//                               <FormLabel>New Password</FormLabel>
//                               <FormControl>
//                                 <Input 
//                                   type="password" 
//                                   placeholder="Enter new password" 
//                                   {...field} 
//                                   value={field.value || ''}
//                                   className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                                 />
//                               </FormControl>
//                               <FormDescription className="text-xs">
//                                 Leave blank to keep current password
//                               </FormDescription>
//                               <FormMessage className="text-xs" />
//                             </FormItem>
//                           )}
//                         />
//                         {form.watch('newPassword') && (
//                           <FormField
//                             control={form.control}
//                             name="confirmPassword"
//                             render={({ field }) => (
//                               <FormItem>
//                                 <FormLabel>Confirm New Password</FormLabel>
//                                 <FormControl>
//                                   <Input 
//                                     type="password" 
//                                     placeholder="Confirm new password" 
//                                     {...field} 
//                                     className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                                   />
//                                 </FormControl>
//                                 <FormMessage className="text-xs" />
//                               </FormItem>
//                             )}
//                           />
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </form>
//             </Form>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AdminSetting;