import type { Response } from 'express';

type TResponse<T> = {
  statusCode: number;
  success: boolean;
  message?: string;
  data?: T;
};

const sendResponse = <T>(res: Response, data: TResponse<T>) => {
  const responseData: any = {
    success: data.success,
  };

  if (data.message !== undefined) {
    responseData.message = data.message;
  }

  if (data.data !== undefined) {
    responseData.data = data.data;
  }

  res.status(data.statusCode).json(responseData);
};

export default sendResponse;
