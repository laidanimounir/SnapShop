import { ar } from "../store/i18n-ar";
import { normalizeDzPhone } from "./phone";

export type FieldErrors = {
  customerName?: string;
  phone?: string;
  address?: string;
  wilaya?: string;
};

export const validateName = (value: string): string | undefined =>
  !value.trim() ? ar.checkout.validation.nameRequired : undefined;

export const validatePhone = (value: string): string | undefined => {
  if (!value.trim()) return ar.checkout.validation.phoneRequired;
  if (!normalizeDzPhone(value)) return ar.checkout.validation.phoneInvalid;
  return undefined;
};

export const validateAddress = (value: string): string | undefined =>
  !value.trim() ? ar.checkout.validation.addressRequired : undefined;

export const validateWilaya = (
  wilayaCode: string,
  hasZones: boolean
): string | undefined =>
  hasZones && !wilayaCode ? ar.checkout.validation.wilayaRequired : undefined;

/** Validates all customer fields at once (used on submit). */
export function validateCheckoutFields({
  customerName,
  phone,
  address,
  wilayaCode,
  hasZones,
}: {
  customerName: string;
  phone: string;
  address: string;
  wilayaCode: string;
  hasZones: boolean;
}): FieldErrors {
  return {
    customerName: validateName(customerName),
    phone: validatePhone(phone),
    address: validateAddress(address),
    wilaya: validateWilaya(wilayaCode, hasZones),
  };
}

export function hasAnyFieldError(errors: FieldErrors): boolean {
  return Boolean(errors.customerName || errors.phone || errors.address || errors.wilaya);
}
