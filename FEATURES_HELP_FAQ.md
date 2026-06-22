# FAQs and Help Feature Documentation

## Overview

This document describes the newly added FAQ and Help features in the CodeMentorAI platform.

## Features Added

### 1. Public FAQ Page

- **Route**: `/faq`
- **Access**: Available to all users (no login required)
- **Features**:
  - Accordion-style FAQ list with 10 common questions
  - Topics covered include: courses, XP points, streaks, certificates, interviews, challenges, pricing, etc.
  - Back button to return to home page
  - Link to log in and contact support for additional help

### 2. Dashboard Help Section

- **Route**: `/dashboard/help`
- **Access**: Logged-in users only (protected by AuthGuard)
- **Features**:
  - Comprehensive FAQ page with expandable questions
  - "Send us a Message" button to contact support
  - Contact information section

### 3. Help Modal (In-Dashboard)

- **Component**: `HelpModal.tsx`
- **Access**: Available from:
  - Dashboard home page (Help & Support button in header)
  - Dashboard help page
  - Any dashboard section that imports the modal
- **Features**:
  - Modal form for sending support messages
  - Fields: Subject, Message, User Email (auto-populated)
  - Real-time form validation
  - Success/error feedback
  - Auto-close on successful submission

### 4. Firebase Integration

- **Collection**: `help_messages`
- **Document Structure**:
  ```
  {
    userId: string,
    userEmail: string,
    subject: string,
    message: string,
    status: "pending" | "resolved",
    createdAt: Timestamp,
    updatedAt: Timestamp
  }
  ```
- **Features**:
  - Automatic timestamps (server-side)
  - User ID and email tracked
  - Status field for support team to manage
  - All messages stored in Firebase Firestore

## Usage

### For Users

#### Accessing FAQs

1. **Without login**: Visit `/faq` from the home page
2. **With login**: Click "Help & Support" in the sidebar or the "Help & Support" button on the dashboard home page

#### Sending a Help Message

1. Click the "Send us a Message" button (available in FAQ pages and dashboard home)
2. Fill in the subject and message
3. Your email will be auto-populated
4. Click "Send Message"
5. You'll see a success notification

### For Support Team

#### Viewing Help Messages

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Open the `help_messages` collection
4. View all support requests with:
   - User information (ID, email)
   - Subject and message content
   - Timestamp of submission
   - Current status (pending/resolved)

#### Managing Messages

1. Update the `status` field to "resolved" after handling
2. Add notes or responses in a separate "response" field if needed

## Files Created/Modified

### New Files

- `/src/app/dashboard/help/page.tsx` - Dashboard help page with FAQs
- `/src/app/faq/page.tsx` - Public FAQ page
- `/src/components/HelpModal.tsx` - Help message modal component

### Modified Files

- `/src/app/dashboard/page.tsx` - Added help button and modal integration
- `/src/components/SidebarNav.tsx` - Added "Help & Support" link to navigation

## Customization

### Adding More FAQs

Edit the `faqs` array in:

- `/src/app/dashboard/help/page.tsx` (for logged-in users)
- `/src/app/faq/page.tsx` (for public users)

Example:

```javascript
const faqs: FAQ[] = [
  {
    id: 11,
    question: "Your new question?",
    answer: "Your detailed answer here...",
  },
  // ... more FAQs
];
```

### Customizing Modal Appearance

Edit styles in `/src/components/HelpModal.tsx`:

- Colors: Change `from-indigo-500` to other Tailwind colors
- Size: Modify `max-w-md` for modal width
- Fields: Add more form fields as needed

### Changing Firebase Collection Name

If you want a different collection name, update in `/src/components/HelpModal.tsx`:

```javascript
await addDoc(collection(db, "your_collection_name"), {
  // ... data
});
```

## Styling

- All components use Tailwind CSS
- Color scheme matches existing CodeMentorAI design (indigo/cyan gradient)
- Responsive design works on mobile and desktop
- Dark mode theme (slate-950 background)

## Error Handling

- Form validation on both client and submit
- Error messages displayed in red modal
- Success messages in green
- Network errors caught and displayed
- Loading states with spinner animation

## Future Enhancements

- [ ] Email notifications when user sends a message
- [ ] Admin dashboard to view/reply to help messages
- [ ] Search/filter for FAQs
- [ ] Categorized FAQs by topic
- [ ] Video tutorials for common questions
- [ ] Live chat support integration
- [ ] Automated responses for common issues
