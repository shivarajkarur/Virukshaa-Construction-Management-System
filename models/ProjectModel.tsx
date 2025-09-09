   import mongoose, { Document, Schema } from 'mongoose';

export interface ITaskSubDoc {
  title: string;
  description: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  assignedTo?: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  _id?: string;
}

export interface IProject extends Document {
  title: string;
  description: string;
  status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
  startDate: string;
  endDate: string;
  budget: number;
  progress: number;
  clientId: string;
  client?: string;
  manager?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  tasks: ITaskSubDoc[];
}

const TaskSubSchema = new Schema<ITaskSubDoc>({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed'],
    default: 'Not Started',
  },
  assignedTo: { type: String },
  dueDate: { type: String },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
  },
}, { _id: true });

const ProjectSchema = new Schema<IProject>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['Planning', 'In Progress', 'Completed', 'On Hold'],
    default: 'Planning',
  },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  budget: { type: Number, required: true },
  progress: { type: Number, default: 0 },
  clientId: { type: String, required: true },
  client: { type: String },
  manager: { type: String },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  tasks: [TaskSubSchema],
}, { timestamps: true });

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);