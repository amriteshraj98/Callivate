# Interview Review System

This document describes the new interview review system that allows interviewers to submit pass/fail results and detailed reviews for candidates.

## Features

### For Interviewers

1. **Submit Review Dialog**
   - Accessible from the meeting room when interview is completed
   - Available in the admin dashboard for completed interviews
   - Available in the interviews page for completed interviews

2. **Review Components**
   - Pass/Fail selection
   - Rating (1-10 scale with star visualization)
   - Detailed feedback text area
   - Key strengths (multi-line input)
   - Areas for improvement (multi-line input)
   - Overall assessment
   - Recommendation for next round (checkbox)

3. **Update Reviews**
   - Interviewers can update existing reviews
   - All fields are pre-populated with current values

### For Candidates

1. **View Review**
   - Accessible from the interviews page for completed interviews with reviews
   - Shows all review details in a clean, organized format
   - Displays pass/fail result prominently
   - Shows rating with star visualization
   - Lists strengths and areas for improvement
   - Shows overall assessment and recommendation

2. **Review Status**
   - "Review Pending" button for completed interviews without reviews
   - "View Review" button for interviews with completed reviews

## Components

### InterviewReviewDialog
- Modal dialog for submitting/updating interview reviews
- Form validation for required fields
- Star rating system
- Multi-line text areas for strengths and improvements

### InterviewReviewDisplay
- Modal dialog for viewing interview reviews
- Clean, organized layout
- Visual indicators for pass/fail status
- Star rating display

### InterviewCard
- Displays interview information
- Shows appropriate action buttons based on user role
- Status and result badges
- Interview details (date, time, duration, participants)

## Database Schema

The interview schema includes:
- `result`: "pass" | "fail"
- `review`: Object containing rating, feedback, strengths, areas for improvement, overall assessment, and recommendation
- `reviewedBy`: Clerk ID of the reviewer
- `reviewedAt`: Timestamp of when review was submitted

## User Roles

- **Interviewers**: Can submit and update reviews for interviews they're assigned to
- **Candidates**: Can view reviews for their own interviews
- **Admins**: Can view and manage all interviews and reviews

## Navigation

- New "Interviews" link in the navbar
- Interviews page shows different content based on user role
- Filter by interview status (scheduled, in-progress, completed)

## Usage

1. **During Interview**: Interviewer can submit review after ending the call
2. **From Dashboard**: Admin can submit/update reviews for any completed interview
3. **From Interviews Page**: Users can view their interviews and take appropriate actions
4. **Review Display**: Candidates can view detailed feedback about their performance

## Security

- Only authorized interviewers can submit reviews for their assigned interviews
- Candidates can only view reviews for their own interviews
- All actions require proper authentication 