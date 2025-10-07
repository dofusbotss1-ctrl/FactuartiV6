import { supabase } from './supabaseClient';

export interface CompanyNameCheckResult {
  isAvailable: boolean;
  error?: string;
}

export const normalizeCompanyName = (name: string): string => {
  return name.trim().toLowerCase();
};

export const checkCompanyNameAvailability = async (
  companyName: string
): Promise<CompanyNameCheckResult> => {
  if (!companyName || !companyName.trim()) {
    return {
      isAvailable: false,
      error: 'Le nom de la société est requis'
    };
  }

  const normalizedName = normalizeCompanyName(companyName);

  try {
    const { data, error } = await supabase
      .from('entreprises')
      .select('id')
      .ilike('name', normalizedName)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking company name:', error);
      return {
        isAvailable: false,
        error: 'Erreur lors de la vérification du nom de société'
      };
    }

    if (data) {
      return {
        isAvailable: false,
        error: 'Ce nom de société existe déjà. Veuillez en choisir un autre.'
      };
    }

    return {
      isAvailable: true
    };
  } catch (err) {
    console.error('Unexpected error checking company name:', err);
    return {
      isAvailable: false,
      error: 'Erreur de connexion. Veuillez réessayer.'
    };
  }
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};
