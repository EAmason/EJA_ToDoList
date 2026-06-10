# Task Tracker
Welcome to Task Tracker, a simple application for tracking your to-do list. Please follow the below instructions to get the application up and running.

## Before Running
Note: These instructions should only need to be run once.
1. Clone the repository in a location of your choice.
2. Install Node.js.
3. Next, if you have the default Windows Execution Policy, you will need to set it to RemoteSigned for atleast your user. To set it globally, run Set-ExecutionPolicy RemoteSigned in an Admin PowerShell.
4. Open PowerShell and navigate to your local copy of the repository.
5. Navigiate to the folder 'to-do-list-frontend'.
6. Run the command 'npm install'.
7. Run the command 'npm install react-router-dom'.
8. Install .NET 10.
9. Open a Command Prompt and navigate to your local copy of the repository.
10. Navigate to the folder 'to-do-list-backend'.
11. Run the command 'dotnet tool restore'.
12. RUn the command 'dotnet ef database update'.

## Instructions to Run
Note: The following instructions apply to Windows PC's.
1. Open up the Command Prompt.
2. Navigate to your local copy of the repository.
3. Navigate to the folder 'to-do-list-backend'.
4. Run 'dotnet run'.
5. Open up PowerShell.
6. Navigate to your local copy of the repository.
7. Navigiate to the folder 'to-do-list-frontend'.
8. Run 'npm start'.
10. http://localhost:3000/ should automatically appear after several seconds. If it does not, you can navigate there manually.

## Instructions for Running Unit Tests
1. To run the backend unit tests, first, open a Command Prompt.
2. Navigate to the file for the backend project.
3. Run 'dotnet test'.
4. To run the frontend unit tests, open PowerShell.
5. Navigate to the folder for the frontend project.
6. Run 'npm test -- --watchAll=false src/components/Dashboard.test.js'.

## How to Use Task Tracker

Using Task Tracker is very simple. First, you will need to log into the application. This requires either having or creating an account. Creating an account requires a first and last name, email address, and password. Once your account is created, you can log in using your email and password.

Once logged into task tracker, you can create tasks using the "Create Task" button. Tasks have the following categories:

1. Title (Required)
2. Description (Optional)
3. Due Date (Required)
4. Priority (Defaults to Medium Priority)
5. Estimated Hours (Optinal)
6. Status (Defaults to Not Started)

Once a task is created, it will fall into one of the following categories:

1. Today's Reminders - Contains tasks with a Priority of "Reminder" that are happening today.
2. Upcoming Reminders - Contains tasks with a Priority of "Reminder" that are occurring within the next week. This section is collapsed by default.
3. Overdue Tasks - Tasks that have a due date which has already passed and are not marked as "Completed".
4. Tasks Due Soon - Tasks that have a due date within the next week.
5. Remaining Tasks - All tasks not included in any of the above categories that are not marked as "Completed".
6. Recently Completed Tasks - Tasks which have been marked as "Completed" within the last week.

Once created, tasks can be edited or deleted by clicking on their titles. This will open a pop-up where full details of the task can be found. Any edits made should be reflected in the overall list when the pop-up is closed.

Task Tracker defaults to the time zone you are logging in from. It will note that at the top of the Dashboard after you log in.

## Assumptions

If this were to be moved to a Production environment, a server would need to be available so that both the frontend and the backend can be left up and running at all times. Additionally, a URL would need to be provided for users to access.