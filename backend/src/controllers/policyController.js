import { PolicyService } from '../services/policyService.js';

export const searchPolicies = async (req, res, next) => {
  try {
    const { q, category } = req.query;
    // Tự động seed mẫu nếu trống
    if (req.user?.companyId) {
      await PolicyService.seedDefaultPoliciesIfEmpty(req.user.companyId);
    }
    const policies = await PolicyService.searchPolicies(q, category);
    res.status(200).json({ success: true, data: policies });
  } catch (error) {
    next(error);
  }
};

export const createPolicy = async (req, res, next) => {
  try {
    const policy = await PolicyService.createPolicy(req.body);
    res.status(201).json({ success: true, data: policy });
  } catch (error) {
    next(error);
  }
};
