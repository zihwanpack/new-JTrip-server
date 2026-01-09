import { Request, Response } from 'express';

import { CalculationService } from '../../domain/services/calculationService';
import { CalculationDataConverter } from '../../data/converters/calculationConverter';
import { sendSuccess, sendError } from '../../utils/responseHelper';

export async function getNumber(req: Request, res: Response) {
  try {
  const calculationService = req.app.get(
    'calculationService',
  ) as CalculationService;

  const number = await calculationService.getNumber();
  const resDto = CalculationDataConverter.toResDto(number);

    sendSuccess(res, 200, 'Number retrieved successfully', resDto);
  } catch (error) {
    console.error('getNumber error:', error);
    sendError(res, 500, 'Failed to get number');
  }
}

export async function plusOne(req: Request, res: Response) {
  try {
  const calculationService = req.app.get(
    'calculationService',
  ) as CalculationService;

  const number = await calculationService.plusOne();
  const resDto = CalculationDataConverter.toResDto(number);

    sendSuccess(res, 200, 'Number incremented successfully', resDto);
  } catch (error) {
    console.error('plusOne error:', error);
    sendError(res, 500, 'Failed to increment number');
  }
}

export async function minusOne(req: Request, res: Response) {
  try {
  const calculationService = req.app.get(
    'calculationService',
  ) as CalculationService;

  const number = await calculationService.minusOne();
  const resDto = CalculationDataConverter.toResDto(number);

    sendSuccess(res, 200, 'Number decremented successfully', resDto);
  } catch (error) {
    console.error('minusOne error:', error);
    sendError(res, 500, 'Failed to decrement number');
  }
}
