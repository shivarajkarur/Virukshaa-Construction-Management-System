import { NextResponse } from 'next/server';
import  connectToDB  from '@/lib/db';
import Message from '@/models/Message';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await connectToDB();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user?.id;
    const userRole = session.user?.role;

    // Get all unique conversation IDs where the user is either sender or receiver
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userRole === 'admin' ? 'superadmin' : 'client', senderId: userId },
            { receiver: userRole === 'admin' ? 'superadmin' : 'client', receiverId: userId }
          ]
        }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $last: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [{ $eq: ['$read', false] }, 1, 0]
            }
          }
        }
      },
      { $sort: { 'lastMessage.timestamp': -1 } }
    ]);

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectToDB();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { participant1, participant2 } = await req.json();
    
    // Create a unique conversation ID by sorting participant IDs
    const conversationId = [participant1, participant2].sort().join('_');
    
    // Check if conversation already exists
    const existingConversation = await Message.findOne({ conversationId });
    
    if (existingConversation) {
      return NextResponse.json({ conversationId });
    }

    // Create a welcome message
    const welcomeMessage = new Message({
      text: 'Conversation started',
      sender: 'system',
      receiver: 'all',
      conversationId,
      timestamp: new Date(),
      read: true
    });

    await welcomeMessage.save();
    
    return NextResponse.json({ conversationId });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
