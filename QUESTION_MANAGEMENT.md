# Question Management System

This document explains how the new question management system works in Callivate.

## Overview

The question management system allows users to create, edit, and manage their own coding interview questions. Users can now add custom questions instead of being limited to the default hardcoded questions.

## Features

### 1. **User-Specific Questions**
- Each user can create their own questions
- Questions are private to the user who created them
- Users can only edit/delete their own questions

### 2. **Default Questions**
- System provides 3 default questions (Two Sum, Reverse String, Palindrome Number)
- Default questions are available to all users
- Default questions cannot be edited or deleted by users

### 3. **Question Management UI**
- Access via the "Questions" link in the navigation bar
- Create new questions with a comprehensive form
- Edit existing questions
- Delete questions (only user-created ones)

## How to Use

### Accessing Question Management
1. Sign in to your account
2. Click on "Questions" in the navigation bar
3. You'll see all your questions and the default questions

### Creating a New Question
1. Click the "Add Question" button
2. Fill in the form:
   - **Title**: The name of your question
   - **Description**: Detailed problem description (supports markdown)
   - **Examples**: Add input/output examples with optional explanations
   - **Starter Code**: Provide starter code for JavaScript, Python, and Java
   - **Constraints**: Add any problem constraints
3. Click "Create Question"

### Editing a Question
1. Find your question in the list
2. Click the edit button (pencil icon)
3. Modify the fields as needed
4. Click "Update Question"

### Deleting a Question
1. Find your question in the list
2. Click the delete button (trash icon)
3. Confirm the deletion

## Technical Implementation

### Database Schema
The system uses a new `questions` table in Convex with the following structure:
```typescript
{
  title: string;
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  starterCode: {
    javascript: string;
    python: string;
    java: string;
  };
  constraints?: string[];
  createdBy: string; // clerkId of the user
  isDefault?: boolean; // marks default questions
}
```

### Convex Functions
- `getQuestions`: Fetches all questions for a user (including defaults)
- `createQuestion`: Creates a new question
- `updateQuestion`: Updates an existing question
- `deleteQuestion`: Deletes a question
- `initializeDefaultQuestions`: Sets up default questions

### Components
- `QuestionManager`: Main component for managing questions
- `CodeEditor`: Updated to use questions from database
- Navigation: Added "Questions" link to navbar

## Migration from Hardcoded Questions

The system automatically:
1. Creates default questions when the app first loads
2. Migrates from hardcoded questions to database-driven questions
3. Maintains backward compatibility

## Security

- Users can only access their own questions
- Default questions are read-only for users
- All operations require authentication
- Proper authorization checks prevent unauthorized access

## Future Enhancements

Potential improvements could include:
- Question sharing between users
- Question categories/tags
- Question difficulty levels
- Question templates
- Bulk import/export functionality 