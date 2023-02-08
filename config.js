// try {
//   const dotenv = await import("dotenv");
//   dotenv.config();
// } catch (error) {
//   console.log(error);
// }

export const databaseUrl =
  process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/watchlistAPI";
export const port = process.env.PORT || "3000";
export const jwtSecret = process.env.JWT_SECRET || "secret"; //IT IS NOT A GOOD IDEA TO STORE YOUR SECRET IN THE CODE! INPUT YOUR OWN SECRET IN THE .env FILE IN THE ROOT DIRECTORY INSTEAD!
export const bcryptFactor = 10;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
export const PASSWORD_REGEX_ERROR_MESSAGE = "Password must contain at least 8 characters, including a lowercase letter, an uppercase letter, a number, and a special character (@$!%*?&).";