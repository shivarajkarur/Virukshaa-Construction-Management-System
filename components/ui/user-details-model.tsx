import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Building, 
  Briefcase, 
  Award, 
  Package,
  DollarSign,
  Truck,
  Clock,
  MapPin,
  Users
} from "lucide-react";

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  type: 'supervisor' | 'employee' | 'client' | 'material' | 'payroll';
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onClose,
  data,
  type
}) => {
  if (!data) return null;

  const renderSupervisorDetails = () => (
    <div className="space-y-6">
      {/* Header with Avatar */}
      <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <Avatar className="h-16 w-16">
          <AvatarImage src={data.avatar} />
          <AvatarFallback className="text-lg">
            {data.name?.split(' ').map((n: string) => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="text-xl font-semibold">{data.name}</h3>
          <p className="text-muted-foreground">{data.position}</p>
          <Badge variant={data.status === 'Active' ? 'default' : 'secondary'} className="mt-1">
            {data.status}
          </Badge>
        </div>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{data.email || 'Not provided'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{data.phone || 'Not provided'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span>{data.department || 'Not specified'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Professional Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Professional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Award className="h-4 w-4 text-muted-foreground" />
            <span>Experience: {data.experience || 'Not specified'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Join Date: {data.joinDate ? new Date(data.joinDate).toLocaleDateString() : 'Not available'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>Projects: {data.projects?.length || 0}</span>
          </div>
        </CardContent>
      </Card>

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Projects</CardTitle>
            <CardDescription>Projects under supervision</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.projects.slice(0, 3).map((project: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="font-medium">{project.name || `Project ${index + 1}`}</span>
                  <Badge variant="outline">{project.status || 'Active'}</Badge>
                </div>
              ))}
              {data.projects.length > 3 && (
                <p className="text-sm text-muted-foreground">
                  +{data.projects.length - 3} more projects
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderEmployeeDetails = () => (
    <div className="space-y-6">
      {/* Header with Avatar */}
      <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
        <Avatar className="h-16 w-16">
          <AvatarImage src={data.avatar} />
          <AvatarFallback className="text-lg">
            {data.name?.split(' ').map((n: string) => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="text-xl font-semibold">{data.name}</h3>
          <p className="text-muted-foreground">{data.position}</p>
          <Badge variant={data.status === 'Active' ? 'default' : 'secondary'} className="mt-1">
            {data.status}
          </Badge>
        </div>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{data.email || 'Not provided'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{data.phone || 'Not provided'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span>{data.department || 'Not specified'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Join Date: {data.joinDate ? new Date(data.joinDate).toLocaleDateString() : 'Not available'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Employment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Employment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Employee ID</p>
              <p className="text-sm text-muted-foreground">{data.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Position</p>
              <p className="text-sm text-muted-foreground">{data.position}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Department</p>
              <p className="text-sm text-muted-foreground">{data.department}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-sm text-muted-foreground">{data.status}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderClientDetails = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
        <h3 className="text-xl font-semibold">{data.company}</h3>
        <p className="text-muted-foreground">Contact: {data.name}</p>
        <Badge variant={data.status === 'Active' ? 'default' : 'secondary'} className="mt-1">
          {data.status}
        </Badge>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span>{data.company}</span>
          </div>
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>Contact Person: {data.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{data.email || 'Not provided'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{data.phone || 'Not provided'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Project Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Total Projects</p>
              <p className="text-lg font-semibold">{data.projects?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Client ID</p>
              <p className="text-sm text-muted-foreground">{data.id}</p>
            </div>
          </div>
          
          {data.projects && data.projects.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Recent Projects</p>
              <div className="space-y-2">
                {data.projects.slice(0, 3).map((project: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="font-medium">{project.name || `Project ${index + 1}`}</span>
                    <Badge variant="outline">{project.status || 'Active'}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderMaterialDetails = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg">
        <h3 className="text-xl font-semibold">{data.name}</h3>
        <p className="text-muted-foreground">{data.category}</p>
        <Badge 
          variant={
            data.status === 'Available' ? 'default' : 
            data.status === 'Low Stock' ? 'destructive' : 
            'secondary'
          } 
          className="mt-1"
        >
          {data.status}
        </Badge>
      </div>

      {/* Material Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Material Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Material ID</p>
              <p className="text-sm text-muted-foreground">{data.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Category</p>
              <p className="text-sm text-muted-foreground">{data.category}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Quantity</p>
              <p className="text-sm text-muted-foreground">{data.quantity} {data.unit}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Unit Price</p>
              <p className="text-sm text-muted-foreground">${data.price?.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Supplier Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span>{data.supplier || 'Not specified'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Last Updated: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleDateString() : 'Not available'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Cost Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Unit Price</p>
              <p className="text-lg font-semibold">${data.price?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Total Value</p>
              <p className="text-lg font-semibold">${((data.quantity || 0) * (data.price || 0)).toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const getModalTitle = () => {
    switch (type) {
      case 'supervisor':
        return 'Supervisor Details';
      case 'employee':
        return 'Employee Details';
      case 'client':
        return 'Client Details';
      case 'material':
        return 'Material Details';
      default:
        return 'Details';
    }
  };

  const renderContent = () => {
    switch (type) {
      case 'supervisor':
        return renderSupervisorDetails();
      case 'employee':
        return renderEmployeeDetails();
      case 'client':
        return renderClientDetails();
      case 'material':
        return renderMaterialDetails();
      default:
        return <div>No details available</div>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          <DialogDescription>
            Comprehensive information and details
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;