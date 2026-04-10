import type { VolumetricWeightInput } from '@layerframe/shared-types';

/**
 * 計算材積重（國際物流用）
 * 材積重 = 長 x 寬 x 高 (cm) / 除數
 * 取材積重和實際重量中較大者計費
 */
export function calculateVolumetricWeight(input: VolumetricWeightInput) {
  const divisor = input.divisor ?? 5000;
  const volumetricWeightKg =
    (input.lengthCm * input.widthCm * input.heightCm) / divisor;

  return {
    volumetricWeightKg: Math.round(volumetricWeightKg * 100) / 100,
    actualWeightKg: input.actualWeightKg,
    chargeableWeightKg: Math.max(volumetricWeightKg, input.actualWeightKg),
  };
}
