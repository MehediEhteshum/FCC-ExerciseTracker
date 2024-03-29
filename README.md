# Exercise Tracker REST API

#### A microservice project, part of Free Code Camp's curriculum

### User Stories

**Check the app here** >>  [![Run on Repl.it](https://repl.it/badge/github/freeCodeCamp/boilerplate-project-exercisetracker)](https://boilerplate-project-exercisetracker.mehediehteshum.repl.co)

1. I can create a user by posting form data username to /api/exercise/new-user and returned will be an object with username and _id.
2. I can get an array of all users by getting api/exercise/users with the same info as when creating a user.
3. I can add an exercise to any user by posting form data userId(_id), description, duration, and optionally date to /api/exercise/add. If no date supplied it will use current date. Returned will be the user object with also with the exercise fields added.
4. I can retrieve a full exercise log of any user by getting /api/exercise/log with a parameter of userId(_id). Return will be the user object with added array log and count (total exercise count).
5. I can retrieve part of the log of any user by also passing along optional parameters of from & to or limit. (Date format yyyy-mm-dd, limit = int)
</br>

![image](https://github.com/MehediEhteshum/FCC-ExerciseTracker/assets/65057419/c69b0c9f-2e9d-4ba4-a572-bc711438abb1)

