import { LegalDocByLocale } from '@/features/legal/types';

import { businessIntroductionRules } from './business-introduction-rules';
import { clubRules } from './club-rules';
import { contactUs } from './contact-us';
import { cookiePolicy } from './cookie-policy';
import { disclaimer } from './disclaimer';
import { partnerRules } from './partner-rules';
import { privacyPolicy } from './privacy-policy';
import { refundPolicy } from './refund-policy';
import { termsOfUse } from './terms-of-use';

export const legalDocRegistry: Record<string, LegalDocByLocale> = {
  'terms-of-use': termsOfUse,
  'privacy-policy': privacyPolicy,
  'cookie-policy': cookiePolicy,
  'club-rules': clubRules,
  'partner-rules': partnerRules,
  'business-introduction-rules': businessIntroductionRules,
  'refund-policy': refundPolicy,
  disclaimer: disclaimer,
  'contact-us': contactUs,
};

export const legalSlugs = Object.keys(legalDocRegistry);
