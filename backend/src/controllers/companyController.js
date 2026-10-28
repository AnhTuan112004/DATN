import * as companyService from '../services/companyService.js';
import { locationSchema, updateLocationSchema } from '../validations/companyValidation.js';

/**
 * GET /api/companies/profile
 */
export const getCompanyProfile = async (req, res, next) => {
  try {
    const profile = await companyService.getCompanyProfile(req.user.companyId);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/companies/profile
 */
export const updateCompanyProfile = async (req, res, next) => {
  try {
    const updated = await companyService.updateCompanyProfile(req.user.companyId, req.body, req.user);
    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin doanh nghiệp thành công',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/companies/locations
 */
export const getLocations = async (req, res, next) => {
  try {
    const locations = await companyService.getLocations(req.user.companyId);
    res.status(200).json({ success: true, data: locations });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/companies/locations
 */
export const addLocation = async (req, res, next) => {
  try {
    const validatedData = locationSchema.parse(req.body);
    const newLocation = await companyService.addLocation(req.user.companyId, validatedData, req.user);
    res.status(201).json({
      success: true,
      message: 'Thêm địa điểm GPS Geofencing thành công',
      data: newLocation,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu địa điểm không hợp lệ',
        details: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    next(error);
  }
};

/**
 * PATCH /api/companies/locations/:locationId
 */
export const updateLocation = async (req, res, next) => {
  try {
    const validatedData = updateLocationSchema.parse(req.body);
    const updated = await companyService.updateLocation(
      req.user.companyId,
      req.params.locationId,
      validatedData,
      req.user
    );
    res.status(200).json({
      success: true,
      message: 'Cập nhật địa điểm GPS Geofencing thành công',
      data: updated,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu địa điểm không hợp lệ',
        details: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    next(error);
  }
};

/**
 * DELETE /api/companies/locations/:locationId
 */
export const deleteLocation = async (req, res, next) => {
  try {
    const result = await companyService.deleteLocation(req.user.companyId, req.params.locationId, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/companies/locations/seed-defense-room
 */
export const seedDefenseLocation = async (req, res, next) => {
  try {
    const location = await companyService.seedDefenseLocation(req.user.companyId, req.user);
    res.status(200).json({
      success: true,
      message: 'Đã thiết lập địa điểm «Phòng Bảo vệ ĐATN - Hội đồng K23» thành công',
      data: location,
    });
  } catch (error) {
    next(error);
  }
};
