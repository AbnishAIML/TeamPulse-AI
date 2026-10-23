import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error("[API Error]", err);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  res.status(statusCode).json({
    success: false,
    message: err.message || "An unexpected server error occurred.",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
