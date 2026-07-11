import { LegalDocByLocale } from '@/features/legal/types';

export const partnerRules: LegalDocByLocale = {
  en: {
    title: 'Partner Rules',
    effectiveDate: 'July 1, 2026',
    version: '1.0',
    operatorLines: ['Kylyvnyk Consulting LLC', 'Florida, United States'],
    sections: [
      {
        heading: '1. General Provisions',
        blocks: [
          {
            type: 'paragraph',
            text: "These Partner Rules (the \"Partner Rules\") govern the participation of business partners in the KYLYVNYK CLUB platform, the procedure for publishing business profiles, publishing special offers, interacting with club members, and the use of the partner features of the platform.",
          },
          { type: 'paragraph', text: 'These Rules supplement:' },
          {
            type: 'list',
            items: [
              'Terms of Use',
              'Privacy Policy',
              'Cookie Policy',
              'other official documents of KYLYVNYK CLUB',
            ],
          },
          {
            type: 'paragraph',
            text: 'In the event of any conflict between these Rules and the Terms of Use, the Terms of Use shall prevail, unless otherwise expressly provided in these Rules.',
          },
          {
            type: 'paragraph',
            text: "Use of the partner features of the platform constitutes the partner's full and unconditional acceptance of these Rules.",
          },
          {
            type: 'paragraph',
            text: 'If the partner does not agree with these Rules, the partner must discontinue use of the partner features of the platform.',
          },
        ],
      },
      {
        heading: '2. Who Can Become a Partner',
        blocks: [
          { type: 'paragraph', text: 'The following may become partners of KYLYVNYK CLUB:' },
          {
            type: 'list',
            items: [
              'legal entities',
              'individual entrepreneurs',
              'self-employed individuals',
              'licensed professionals',
              'independent consultants',
              'professional organizations',
              'non-profit organizations',
              'state and municipal organizations, if their participation is permitted by applicable law',
              "other individuals and organizations whose activities meet the platform's requirements",
            ],
          },
          {
            type: 'paragraph',
            text: 'Partner status is granted solely at the discretion of KYLYVNYK CLUB.',
          },
          {
            type: 'paragraph',
            text: 'Submitting an application to participate as a partner does not create any obligation for the platform to approve such application.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB may refuse to grant partner status without explanation, to the extent permitted by applicable law.',
          },
        ],
      },
      {
        heading: '3. Partner Requirements',
        blocks: [
          { type: 'paragraph', text: 'The partner must:' },
          {
            type: 'list',
            items: [
              'operate on a lawful basis',
              'comply with applicable law',
              'provide accurate, up-to-date, and complete information',
              'update information in a timely manner',
              'not mislead users',
              'comply with these Rules',
              "comply with the platform's Terms of Use",
              'respect the rights of users and other partners',
              'act in good faith when interacting with club members',
              'comply with published special offers in accordance with these Rules, the Terms of Use, and other platform documents',
            ],
          },
          { type: 'paragraph', text: 'The partner may not:' },
          {
            type: 'list',
            items: [
              'publish false or misleading information',
              'use fraudulent schemes',
              'conceal material terms of offers',
              'publish special offers known to be inaccurate',
              'pose as a representative of KYLYVNYK CLUB',
              "use the KYLYVNYK CLUB brand without the platform's permission",
              'use the platform for unlawful activity',
              'violate the rights of third parties',
              'engage in activity capable of causing harm to the platform, its users, or other partners',
            ],
          },
          {
            type: 'paragraph',
            text: "The partner is solely responsible for its own activities, goods, services, licenses, permits, prices, warranties, marketing materials, and compliance with law.",
          },
        ],
      },
      {
        heading: '4. Licenses and Permits',
        blocks: [
          {
            type: 'paragraph',
            text: "If the partner's activity requires licenses, permits, certificates, or other authorizing documents, the partner must hold such documents throughout the entire period of its participation in the platform.",
          },
          {
            type: 'paragraph',
            text: 'Upon request of KYLYVNYK CLUB, the partner must provide documents confirming:',
          },
          {
            type: 'list',
            items: [
              'business registration',
              'the right to conduct the activity',
              'the existence of licenses',
              'the existence of permits',
              'the existence of certificates',
              'the right to represent the relevant business, organization, or entrepreneur',
            ],
          },
          {
            type: 'paragraph',
            text: 'The partner undertakes to promptly notify the platform of the termination of any licenses, permits, or other documents that may affect the lawfulness of its activity.',
          },
          {
            type: 'paragraph',
            text: 'Publication of a business profile does not mean that KYLYVNYK CLUB has verified, confirmed, or guarantees that the partner holds all necessary licenses and permits.',
          },
        ],
      },
      {
        heading: '5. Business Verification',
        blocks: [
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB may verify partners and business profiles before publication, after publication, or at any time while the platform is being used.',
          },
          { type: 'paragraph', text: 'Verification may include:' },
          {
            type: 'list',
            items: [
              'review of documents provided by the partner',
              'review of official registers',
              'review of licenses and permits',
              'review of websites',
              'review of social media',
              'review of publicly available information',
              'review of reviews and complaints',
              'review of information received from platform users',
              'other lawful verification methods',
            ],
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB may use automated and non-automated methods of verifying information.',
          },
          {
            type: 'paragraph',
            text: "Conducting a verification does not constitute approval, recommendation, certification, or a guarantee of the quality of the partner's activity.",
          },
          {
            type: 'paragraph',
            text: "The platform is not obligated to continuously monitor partners' activities.",
          },
          {
            type: 'paragraph',
            text: "The absence of verification, or the failure to conduct verification, does not constitute approval, recommendation, guarantee, certification, or acceptance by the platform of responsibility for the partner's activities, goods, services, licenses, permits, or compliance with law.",
          },
          {
            type: 'paragraph',
            text: 'The partner undertakes to cooperate with the platform during verifications and to promptly provide reasonably requested information.',
          },
          { type: 'paragraph', text: 'Refusal to provide information or documents may result in:' },
          {
            type: 'list',
            items: [
              'refusal to publish the profile',
              'hiding of the profile',
              'restriction of certain functions',
              'suspension of partner status',
              'termination of participation in the partner program',
            ],
          },
        ],
      },
      {
        heading: '6. Business Profiles',
        blocks: [
          {
            type: 'paragraph',
            text: 'The partner may apply to create and publish a business profile on the KYLYVNYK CLUB platform.',
          },
          { type: 'paragraph', text: 'A business profile may contain:' },
          {
            type: 'list',
            items: [
              'business name',
              'description of activity',
              'logos',
              'photographs',
              'contact information',
              'website links',
              'social media links',
              'information on licenses and certificates',
              'special offers',
              'discounts',
              'bonuses',
              'service area',
              'business hours',
              'information on means of contact',
              'information on the goods and services offered',
              "other information relating to the partner's activity",
            ],
          },
          { type: 'paragraph', text: 'Business profile statuses may include:' },
          {
            type: 'list',
            items: ['UNDER REVIEW', 'PUBLISHED', 'HIDDEN', 'SUSPENDED', 'REMOVED'],
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB may, at its own discretion, publish, reject, hide, suspend, or remove business profiles.',
          },
          {
            type: 'paragraph',
            text: "Publication of a business profile does not constitute a recommendation, certification, quality guarantee, licensing, or confirmation of the partner's activity by the platform.",
          },
          {
            type: 'paragraph',
            text: 'The partner bears full responsibility for all information published in its business profile.',
          },
          {
            type: 'paragraph',
            text: 'The partner is responsible for the timely updating of such information and for the consequences of publishing inaccurate, incomplete, outdated, or misleading information.',
          },
        ],
      },
      {
        heading: '7. Partner Special Offers',
        blocks: [
          {
            type: 'paragraph',
            text: 'The partner may publish special offers, discounts, bonuses, promotions, privileges, or other offers for club members on the platform.',
          },
          {
            type: 'paragraph',
            text: 'Each partner independently determines the content of its offers and bears full responsibility for their legality, accuracy, relevance, and fulfillment.',
          },
          {
            type: 'paragraph',
            text: 'The partner undertakes not to publish special offers, discounts, bonuses, or other offers that are knowingly false, misleading, discriminatory, unlawful, or objectively unfeasible.',
          },
          {
            type: 'paragraph',
            text: 'If a partner publishes, posts, or confirms a special offer on the KYLYVNYK CLUB platform, the partner undertakes to honor such offer with respect to a club member who:',
          },
          {
            type: 'list',
            items: [
              'holds a valid digital club card',
              'meets the requirements of the offer',
              'has fulfilled the terms of the relevant offer',
            ],
          },
          {
            type: 'paragraph',
            text: 'The partner may not arbitrarily refuse to provide a published special offer to a club member who has satisfied all requirements of the offer.',
          },
          {
            type: 'paragraph',
            text: 'If an offer contains restrictions, territorial conditions, validity periods, requirements for advance booking, a minimum order amount, quantity limitations, or other material terms, such terms must be clearly and unambiguously stated by the partner.',
          },
          {
            type: 'paragraph',
            text: 'The partner must promptly update information about special offers and immediately notify the platform of the termination or material change of an offer.',
          },
          {
            type: 'paragraph',
            text: 'Systematic violation of published special offers may serve as grounds for applying the measures provided for in these Rules.',
          },
          {
            type: 'paragraph',
            text: "Notwithstanding the provisions of this section, KYLYVNYK CLUB is not a guarantor of the partner's performance of its obligations and bears no responsibility for the partner's refusal to provide goods, services, discounts, bonuses, or other special offers.",
          },
        ],
      },
      {
        heading: '8. Partner Obligations',
        blocks: [
          { type: 'paragraph', text: 'The partner must:' },
          {
            type: 'list',
            items: [
              'keep information up to date',
              'comply with published special offers',
              'comply with applicable law',
              'comply with consumer rights',
              'comply with the rights of platform users',
              'provide accurate information',
              'respond promptly to reasonable requests from the platform',
              'cooperate during verifications and complaint reviews',
              'act in good faith when interacting with club members',
              'not mislead users regarding its goods, services, prices, licenses, permits, or special offers',
            ],
          },
          {
            type: 'paragraph',
            text: 'The partner undertakes to immediately notify the platform of:',
          },
          {
            type: 'list',
            items: [
              'cessation of activity',
              'a change in business ownership',
              'changes to licenses or permits',
              'a material change in the goods or services offered',
              'termination of special offers',
              'changes to contact information',
              "other circumstances capable of affecting platform users or the partner's activity on the platform",
            ],
          },
        ],
      },
      {
        heading: '9. Member Complaints',
        blocks: [
          {
            type: 'paragraph',
            text: 'Platform members may submit complaints, inquiries, and reports of possible violations by partners.',
          },
          { type: 'paragraph', text: 'KYLYVNYK CLUB may, but is not obligated to:' },
          {
            type: 'list',
            items: [
              'review incoming inquiries',
              'request explanations from partners',
              'request documents and evidence',
              'conduct an internal review',
              'temporarily hide special offers pending review',
              'temporarily hide business profiles pending review',
              'apply the measures provided for in these Rules',
            ],
          },
          {
            type: 'paragraph',
            text: 'The platform is not obligated to act as an arbitrator, mediator, representative, or advocate for any party to a dispute.',
          },
          {
            type: 'paragraph',
            text: 'The fact that a complaint has been reviewed does not constitute an admission of fault by the partner or confirmation that the complainant is correct.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB may make decisions based on information the platform considers reasonably sufficient in the particular situation.',
          },
          {
            type: 'paragraph',
            text: 'The platform is not obligated to disclose to the partner or the complainant internal review materials, internal decision-making procedures, or information received from third parties.',
          },
        ],
      },
      {
        heading: '10. Enforcement Measures and Violations',
        blocks: [
          {
            type: 'paragraph',
            text: 'In the event of a violation of these Rules, the Terms of Use, published special offers, or other platform documents, KYLYVNYK CLUB may apply one or more of the following measures:',
          },
          {
            type: 'list',
            items: [
              'warning',
              'a request to remedy the violation',
              'temporary hiding of the special offer',
              'temporary hiding of the business profile',
              'restriction of certain platform functions',
              'suspension of partner status',
              'removal of the business profile',
              'refusal of further publication on the platform',
            ],
          },
          {
            type: 'paragraph',
            text: 'The choice of a specific measure is made solely at the discretion of KYLYVNYK CLUB, taking into account the nature of the violation, its consequences, and other circumstances.',
          },
          {
            type: 'paragraph',
            text: "KYLYVNYK CLUB may apply the above measures either temporarily or for an indefinite period, depending on the nature of the violation, the degree of risk to the platform, users, partners, and other circumstances of the particular case.",
          },
          {
            type: 'paragraph',
            text: "Application of one measure does not limit the platform's right to apply additional measures in the future.",
          },
          {
            type: 'paragraph',
            text: 'The above measures may be applied without payment of any compensation to the partner, to the extent permitted by applicable law.',
          },
          {
            type: 'paragraph',
            text: "These Rules do not provide for contractual penalties, financial sanctions, guaranteed compensation for losses, or any obligation of the platform to reimburse any expenses of the partner related to the application of enforcement measures.",
          },
        ],
      },
      {
        heading: '11. No Guarantees',
        blocks: [
          {
            type: 'paragraph',
            text: 'Participation in the KYLYVNYK CLUB partner program is voluntary.',
          },
          { type: 'paragraph', text: 'KYLYVNYK CLUB does not guarantee the partner:' },
          {
            type: 'list',
            items: [
              'acquisition of customers',
              'receipt of orders',
              'receipt of contracts',
              'receipt of profit',
              'receipt of income',
              'increased sales',
              'an increased number of inquiries',
              'recovery of expenses',
              'achievement of commercial results',
              'business growth',
              'a specific number of profile views',
              'a specific number of click-throughs',
              'a specific number of referrals',
              'a specific level of business activity',
              'continuation of special offers in the future',
              'retention of partner status',
              'continued placement of the business profile on the platform',
            ],
          },
          {
            type: 'paragraph',
            text: "Any results depend on numerous factors beyond the platform's control.",
          },
        ],
      },
      {
        heading: '12. Independence of Partners',
        blocks: [
          { type: 'paragraph', text: 'Partners of the platform are independent third parties.' },
          {
            type: 'paragraph',
            text: 'Participation in the partner program does not create between the partner and KYLYVNYK CLUB any relationship of:',
          },
          {
            type: 'list',
            items: [
              'employer and employee',
              'agent and principal',
              'representative and principal',
              'partnership',
              'joint venture',
              'franchising',
              'commercial agency',
              'distributorship',
              'investment relationship',
              "any other relationship not expressly provided for in the platform's documents",
            ],
          },
          {
            type: 'paragraph',
            text: 'The partner may not make statements or create the impression that it acts on behalf of KYLYVNYK CLUB.',
          },
          {
            type: 'paragraph',
            text: 'The partner may not use the expressions "official representative of KYLYVNYK CLUB," "agent of KYLYVNYK CLUB," "franchisee of KYLYVNYK CLUB," "employee of KYLYVNYK CLUB," or other similar designations without the platform\'s prior written permission.',
          },
          {
            type: 'paragraph',
            text: 'The partner may not assume obligations on behalf of the platform, enter into agreements on behalf of the platform, or provide any guarantees on behalf of the platform.',
          },
        ],
      },
      {
        heading: '13. Compliance with Law',
        blocks: [
          {
            type: 'paragraph',
            text: 'The partner must comply with the laws of the country, region, or territory in which it operates.',
          },
          { type: 'paragraph', text: 'The partner is independently responsible for:' },
          {
            type: 'list',
            items: [
              'licenses',
              'permits',
              'business registration',
              'taxes',
              'labor relations',
              'consumer protection',
              'advertising',
              'processing of personal data',
              'compliance with sanctions restrictions',
              'compliance with export control',
              'compliance with product and service labeling requirements',
              'compliance with industry requirements',
              'other legal requirements',
            ],
          },
          {
            type: 'paragraph',
            text: "KYLYVNYK CLUB is not responsible for the partner's failure to comply with legal requirements.",
          },
        ],
      },
      {
        heading: '14. Intellectual Property',
        blocks: [
          {
            type: 'paragraph',
            text: 'All rights to the KYLYVNYK CLUB brand, the KYLYVNYK brand, logos, brand identity elements, platform design, digital club cards, promotional materials, texts, images, databases, and other intellectual property belong to KYLYVNYK CLUB, Kylyvnyk Consulting LLC, or the respective rights holders.',
          },
          {
            type: 'paragraph',
            text: "The partner may not use the KYLYVNYK CLUB brand, the KYLYVNYK brand, logos, or other intellectual property of the platform without prior written permission.",
          },
          {
            type: 'paragraph',
            text: "Publication of a business profile does not grant the partner any rights to the platform's intellectual property.",
          },
          {
            type: 'paragraph',
            text: 'The partner may use marketing materials, logos, partner badges, banners, or other materials provided by the platform solely to the extent and in the manner expressly permitted by KYLYVNYK CLUB.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB may revoke a previously granted permission to use such materials at any time.',
          },
          {
            type: 'paragraph',
            text: 'Upon receipt of notice of revocation of permission, the partner must discontinue use of the relevant materials within a reasonable time, unless otherwise agreed in writing by the parties.',
          },
        ],
      },
      {
        heading: '15. Limitation of Platform Liability',
        blocks: [
          {
            type: 'paragraph',
            text: 'To the maximum extent permitted by law, KYLYVNYK CLUB, Kylyvnyk Consulting LLC, its owners, officers, employees, contractors, representatives, and affiliates shall not be liable for:',
          },
          {
            type: 'list',
            items: [
              'acts or omissions of partners',
              'acts of platform users',
              "the commercial results of a partner's activities",
              'loss of customers',
              'loss of profit',
              'loss of business reputation',
              'loss of data',
              'lost profits',
              'indirect damages',
              'special damages',
              'punitive damages',
              'incidental damages',
              'loss of business opportunities',
              "termination of a partner's participation in the program",
              'removal or hiding of a business profile',
              "changes to the platform's algorithms, functions, or capabilities",
            ],
          },
          {
            type: 'paragraph',
            text: 'This section shall be interpreted as broadly as possible, to the extent permitted by applicable law.',
          },
          {
            type: 'paragraph',
            text: "The maximum aggregate liability of KYLYVNYK CLUB to the partner for any claims, demands, disputes, or lawsuits is limited to the amount actually paid by the partner to the platform during the three (3) calendar months immediately preceding the occurrence of the relevant claim.",
          },
          {
            type: 'paragraph',
            text: "If the partner has not paid for the platform's services during the specified period, KYLYVNYK CLUB shall bear no monetary liability, to the maximum extent permitted by applicable law.",
          },
        ],
      },
      {
        heading: '16. Termination of Partner Participation',
        blocks: [
          {
            type: 'paragraph',
            text: 'The partner may terminate its participation in the partner program at any time.',
          },
          {
            type: 'paragraph',
            text: "KYLYVNYK CLUB may terminate a partner's participation in whole or in part in the following cases:",
          },
          {
            type: 'list',
            items: [
              'violation of these Rules',
              'violation of the Terms of Use',
              'violation of law',
              'provision of inaccurate information',
              'user complaints',
              'refusal to cooperate during verifications',
              'creation of legal, financial, operational, or reputational risks for the platform',
              'violation of special offers',
              'violation of the rights of third parties',
            ],
          },
          {
            type: 'paragraph',
            text: 'Termination of participation may be accompanied by the removal, hiding, or deactivation of the business profile.',
          },
          {
            type: 'paragraph',
            text: "KYLYVNYK CLUB may retain archived records, interaction history, verification documents, correspondence, information about violations, and other information related to the partner's participation, to the extent necessary to comply with law, resolve disputes, prevent fraud, ensure platform security, and protect the legitimate interests of KYLYVNYK CLUB.",
          },
          {
            type: 'paragraph',
            text: "Termination of a partner's participation does not create any obligation for the platform to refund previously paid amounts, except as expressly provided by applicable law or by separate written agreements between the parties.",
          },
        ],
      },
      {
        heading: '17. Changes to These Rules',
        blocks: [
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB may periodically amend these Partner Rules.',
          },
          {
            type: 'paragraph',
            text: 'The updated version is published on the platform indicating the new effective date or the date of the last update.',
          },
          {
            type: 'paragraph',
            text: "Continued use of the platform after the amendments take effect constitutes the partner's acceptance of the updated Rules, to the extent permitted by applicable law.",
          },
          {
            type: 'paragraph',
            text: 'If the partner does not agree with the changes, the partner must discontinue participation in the partner program and use of the corresponding platform features.',
          },
        ],
      },
      {
        heading: '18. Entire Agreement',
        blocks: [
          {
            type: 'paragraph',
            text: 'These Partner Rules form part of the overall legal documentation of KYLYVNYK CLUB.',
          },
          {
            type: 'paragraph',
            text: 'Together with the Terms of Use, Privacy Policy, Cookie Policy, Club Rules, Business Introduction Rules, Refund Policy, Disclaimer, and other official documents of the platform, these Rules constitute the entire agreement between the platform and the partner regarding participation in the partner program.',
          },
          {
            type: 'paragraph',
            text: "In the event of any conflict between these Partner Rules and the Terms of Use, the Terms of Use shall prevail, unless otherwise expressly provided by the platform's documents.",
          },
        ],
      },
      {
        heading: '19. Contact Information',
        blocks: [
          { type: 'paragraph', text: 'KYLYVNYK CLUB' },
          { type: 'paragraph', text: 'Operated by:' },
          { type: 'paragraph', text: 'Kylyvnyk Consulting LLC' },
          { type: 'paragraph', text: 'Email: kylyvnykclub@gmail.com' },
          { type: 'paragraph', text: 'Mailing address:' },
          { type: 'paragraph', text: '6 Pauline Pl' },
          { type: 'paragraph', text: 'Palm Coast, FL 32164-7535' },
          { type: 'paragraph', text: 'United States' },
          {
            type: 'paragraph',
            text: 'For matters related to participation in the partner program, the partner may contact us using the details above.',
          },
          {
            type: 'paragraph',
            text: "KYLYVNYK CLUB may independently determine the manner, timing, and scope of responses to partner inquiries, unless otherwise provided by mandatory legal requirements.",
          },
        ],
      },
    ],
    note: 'This document may be translated into other languages for the convenience of users and partners. In the event of any discrepancy, conflict, or difference between translations, the official English-language version of this document shall prevail.',
  },
  ru: {
    title: 'Правила партнёров',
    effectiveDate: '1 июля 2026 года',
    version: '1.0',
    operatorLines: ['Kylyvnyk Consulting LLC', 'Florida, United States'],
    sections: [
      {
        heading: '1. Общие положения',
        blocks: [
          {
            type: 'paragraph',
            text: 'Настоящие Partner Rules («Правила партнёров») регулируют участие бизнес-партнёров в платформе KYLYVNYK CLUB, порядок размещения бизнес-профилей, публикации специальных условий, взаимодействия с участниками клуба и использование партнёрских функций платформы.',
          },
          { type: 'paragraph', text: 'Настоящие Правила являются дополнением к:' },
          {
            type: 'list',
            items: [
              'Terms of Use',
              'Privacy Policy',
              'Cookie Policy',
              'иным официальным документам KYLYVNYK CLUB',
            ],
          },
          {
            type: 'paragraph',
            text: 'В случае противоречия между настоящими Правилами и Terms of Use преимущественную силу имеют Terms of Use, если иное прямо не предусмотрено настоящими Правилами.',
          },
          {
            type: 'paragraph',
            text: 'Использование партнёрских функций платформы означает полное и безусловное согласие партнёра с настоящими Правилами.',
          },
          {
            type: 'paragraph',
            text: 'Если партнёр не согласен с настоящими Правилами, он обязан прекратить использование партнёрских функций платформы.',
          },
        ],
      },
      {
        heading: '2. Кто может стать партнёром',
        blocks: [
          { type: 'paragraph', text: 'Партнёром KYLYVNYK CLUB могут стать:' },
          {
            type: 'list',
            items: [
              'юридические лица',
              'индивидуальные предприниматели',
              'самозанятые лица',
              'лицензированные специалисты',
              'независимые консультанты',
              'профессиональные организации',
              'некоммерческие организации',
              'государственные и муниципальные организации, если их участие допускается применимым законодательством',
              'иные лица и организации, деятельность которых соответствует требованиям платформы',
            ],
          },
          {
            type: 'paragraph',
            text: 'Статус партнёра предоставляется исключительно по усмотрению KYLYVNYK CLUB.',
          },
          {
            type: 'paragraph',
            text: 'Подача заявки на участие в качестве партнёра не создаёт обязанности платформы одобрить такую заявку.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB вправе отказать в предоставлении статуса партнёра без объяснения причин в пределах, допускаемых применимым законодательством.',
          },
        ],
      },
      {
        heading: '3. Требования к партнёру',
        blocks: [
          { type: 'paragraph', text: 'Партнёр обязан:' },
          {
            type: 'list',
            items: [
              'осуществлять деятельность на законных основаниях',
              'соблюдать применимое законодательство',
              'предоставлять достоверную, актуальную и полную информацию',
              'своевременно обновлять информацию',
              'не вводить пользователей в заблуждение',
              'соблюдать настоящие Правила',
              'соблюдать Terms of Use платформы',
              'уважать права пользователей и иных партнёров',
              'действовать добросовестно при взаимодействии с участниками клуба',
              'соблюдать опубликованные специальные условия в соответствии с настоящими Правилами, Terms of Use и иными документами платформы',
            ],
          },
          { type: 'paragraph', text: 'Партнёр не вправе:' },
          {
            type: 'list',
            items: [
              'публиковать ложную либо вводящую в заблуждение информацию',
              'использовать мошеннические схемы',
              'скрывать существенные условия предложений',
              'публиковать заведомо недостоверные специальные условия',
              'выдавать себя за представителя KYLYVNYK CLUB',
              'использовать бренд KYLYVNYK CLUB без разрешения платформы',
              'использовать платформу для незаконной деятельности',
              'нарушать права третьих лиц',
              'осуществлять деятельность, способную причинить ущерб платформе, её пользователям либо иным партнёрам',
            ],
          },
          {
            type: 'paragraph',
            text: 'Партнёр несёт самостоятельную ответственность за свою деятельность, товары, услуги, лицензии, разрешения, цены, гарантии, маркетинговые материалы и соблюдение законодательства.',
          },
        ],
      },
      {
        heading: '4. Лицензии и разрешения',
        blocks: [
          {
            type: 'paragraph',
            text: 'Если деятельность партнёра требует лицензий, разрешений, сертификатов либо иных разрешительных документов, партнёр обязан иметь такие документы в течение всего периода участия в платформе.',
          },
          {
            type: 'paragraph',
            text: 'По запросу KYLYVNYK CLUB партнёр обязан предоставить документы, подтверждающие:',
          },
          {
            type: 'list',
            items: [
              'регистрацию бизнеса',
              'право ведения деятельности',
              'наличие лицензий',
              'наличие разрешений',
              'наличие сертификатов',
              'право представлять соответствующий бизнес, организацию либо предпринимателя',
            ],
          },
          {
            type: 'paragraph',
            text: 'Партнёр обязуется незамедлительно уведомлять платформу о прекращении действия лицензий, разрешений либо иных документов, которые могут повлиять на законность его деятельности.',
          },
          {
            type: 'paragraph',
            text: 'Размещение бизнес-профиля не означает, что KYLYVNYK CLUB проверил, подтвердил либо гарантирует наличие у партнёра всех необходимых лицензий и разрешений.',
          },
        ],
      },
      {
        heading: '5. Проверка бизнеса',
        blocks: [
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB вправе осуществлять проверку партнёров и бизнес-профилей до публикации, после публикации либо в любой момент использования платформы.',
          },
          { type: 'paragraph', text: 'Проверка может включать:' },
          {
            type: 'list',
            items: [
              'анализ документов, предоставленных партнёром',
              'анализ официальных реестров',
              'анализ лицензий и разрешений',
              'анализ веб-сайтов',
              'анализ социальных сетей',
              'анализ публичной информации',
              'анализ отзывов и жалоб',
              'анализ информации, полученной от пользователей платформы',
              'иные законные методы проверки',
            ],
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB вправе использовать автоматизированные и неавтоматизированные методы проверки информации.',
          },
          {
            type: 'paragraph',
            text: 'Проведение проверки не означает одобрение, рекомендацию, сертификацию либо гарантию качества деятельности партнёра.',
          },
          {
            type: 'paragraph',
            text: 'Платформа не обязана осуществлять постоянный мониторинг деятельности партнёров.',
          },
          {
            type: 'paragraph',
            text: 'Отсутствие проверки либо непроведение проверки не означает одобрение, рекомендацию, гарантию, сертификацию либо принятие платформой ответственности за деятельность партнёра, его товары, услуги, лицензии, разрешения либо соблюдение законодательства.',
          },
          {
            type: 'paragraph',
            text: 'Партнёр обязуется сотрудничать с платформой при проведении проверок и своевременно предоставлять разумно запрашиваемую информацию.',
          },
          { type: 'paragraph', text: 'Отказ предоставить информацию либо документы может привести к:' },
          {
            type: 'list',
            items: [
              'отказу в публикации профиля',
              'скрытию профиля',
              'ограничению отдельных функций',
              'приостановлению статуса партнёра',
              'прекращению участия в программе партнёров',
            ],
          },
        ],
      },
      {
        heading: '6. Бизнес-профили',
        blocks: [
          {
            type: 'paragraph',
            text: 'Партнёр может подать заявку на создание и размещение бизнес-профиля на платформе KYLYVNYK CLUB.',
          },
          { type: 'paragraph', text: 'Бизнес-профиль может содержать:' },
          {
            type: 'list',
            items: [
              'название бизнеса',
              'описание деятельности',
              'логотипы',
              'фотографии',
              'контактную информацию',
              'ссылки на веб-сайты',
              'ссылки на социальные сети',
              'информацию о лицензиях и сертификатах',
              'специальные условия',
              'скидки',
              'бонусы',
              'территорию обслуживания',
              'часы работы',
              'информацию о способах связи',
              'сведения о предлагаемых товарах и услугах',
              'иные сведения, относящиеся к деятельности партнёра',
            ],
          },
          { type: 'paragraph', text: 'Статусы бизнес-профилей могут включать:' },
          {
            type: 'list',
            items: ['UNDER REVIEW', 'PUBLISHED', 'HIDDEN', 'SUSPENDED', 'REMOVED'],
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB вправе по собственному усмотрению публиковать, отклонять, скрывать, приостанавливать либо удалять бизнес-профили.',
          },
          {
            type: 'paragraph',
            text: 'Публикация бизнес-профиля не является рекомендацией, сертификацией, гарантией качества, лицензированием либо подтверждением деятельности партнёра со стороны платформы.',
          },
          {
            type: 'paragraph',
            text: 'Партнёр несёт полную ответственность за всю информацию, размещённую в своём бизнес-профиле.',
          },
          {
            type: 'paragraph',
            text: 'Партнёр несёт ответственность за своевременное обновление такой информации и за последствия размещения недостоверных, неполных, устаревших либо вводящих в заблуждение сведений.',
          },
        ],
      },
      {
        heading: '7. Специальные условия партнёров',
        blocks: [
          {
            type: 'paragraph',
            text: 'Партнёр вправе размещать на платформе специальные условия, скидки, бонусы, акции, привилегии либо иные предложения для участников клуба.',
          },
          {
            type: 'paragraph',
            text: 'Каждый партнёр самостоятельно определяет содержание своих предложений и несёт полную ответственность за их законность, достоверность, актуальность и исполнение.',
          },
          {
            type: 'paragraph',
            text: 'Партнёр обязуется не публиковать специальные условия, скидки, бонусы либо иные предложения, которые являются заведомо ложными, вводящими в заблуждение, дискриминационными, незаконными либо объективно невыполнимыми.',
          },
          {
            type: 'paragraph',
            text: 'Если партнёр размещает, публикует либо подтверждает специальное условие на платформе KYLYVNYK CLUB, партнёр обязуется соблюдать такое условие в отношении участника клуба, который:',
          },
          {
            type: 'list',
            items: [
              'имеет действующую цифровую клубную карту',
              'соответствует требованиям предложения',
              'выполнил условия соответствующего предложения',
            ],
          },
          {
            type: 'paragraph',
            text: 'Партнёр не вправе произвольно отказывать участнику клуба в предоставлении опубликованного специального условия при соблюдении участником всех требований предложения.',
          },
          {
            type: 'paragraph',
            text: 'Если предложение содержит ограничения, территориальные условия, сроки действия, требования к предварительной записи, минимальной сумме заказа, количественные ограничения либо иные существенные условия, такие условия должны быть ясно и однозначно указаны партнёром.',
          },
          {
            type: 'paragraph',
            text: 'Партнёр обязан своевременно обновлять информацию о специальных условиях и незамедлительно уведомлять платформу о прекращении действия либо существенном изменении предложения.',
          },
          {
            type: 'paragraph',
            text: 'Систематическое нарушение опубликованных специальных условий может являться основанием для применения мер, предусмотренных настоящими Правилами.',
          },
          {
            type: 'paragraph',
            text: 'Несмотря на положения настоящего раздела, KYLYVNYK CLUB не является гарантом исполнения обязательств партнёра и не несёт ответственности за отказ партнёра предоставить товары, услуги, скидки, бонусы либо иные специальные условия.',
          },
        ],
      },
      {
        heading: '8. Обязанности партнёра',
        blocks: [
          { type: 'paragraph', text: 'Партнёр обязан:' },
          {
            type: 'list',
            items: [
              'поддерживать актуальность информации',
              'соблюдать опубликованные специальные условия',
              'соблюдать применимое законодательство',
              'соблюдать права потребителей',
              'соблюдать права пользователей платформы',
              'предоставлять достоверную информацию',
              'своевременно отвечать на разумные запросы платформы',
              'сотрудничать при проверках и рассмотрении жалоб',
              'действовать добросовестно при взаимодействии с участниками клуба',
              'не вводить пользователей в заблуждение относительно своих товаров, услуг, цен, лицензий, разрешений либо специальных условий',
            ],
          },
          { type: 'paragraph', text: 'Партнёр обязуется незамедлительно уведомлять платформу о:' },
          {
            type: 'list',
            items: [
              'прекращении деятельности',
              'смене владельца бизнеса',
              'изменении лицензий либо разрешений',
              'существенном изменении предлагаемых товаров либо услуг',
              'прекращении действия специальных условий',
              'изменении контактных данных',
              'иных обстоятельствах, способных повлиять на пользователей платформы либо деятельность партнёра на платформе',
            ],
          },
        ],
      },
      {
        heading: '9. Жалобы участников',
        blocks: [
          {
            type: 'paragraph',
            text: 'Участники платформы вправе направлять жалобы, обращения и сообщения о возможных нарушениях со стороны партнёров.',
          },
          { type: 'paragraph', text: 'KYLYVNYK CLUB вправе, но не обязан:' },
          {
            type: 'list',
            items: [
              'рассматривать поступающие обращения',
              'запрашивать объяснения у партнёров',
              'запрашивать документы и доказательства',
              'проводить внутреннюю проверку',
              'временно скрывать специальные предложения на период проверки',
              'временно скрывать бизнес-профили на период проверки',
              'принимать меры, предусмотренные настоящими Правилами',
            ],
          },
          {
            type: 'paragraph',
            text: 'Платформа не обязана выступать арбитром, посредником, представителем либо защитником какой-либо стороны спора.',
          },
          {
            type: 'paragraph',
            text: 'Факт рассмотрения жалобы не означает признание вины партнёра либо правоты заявителя.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB вправе принимать решения на основании информации, которую платформа считает разумно достаточной в конкретной ситуации.',
          },
          {
            type: 'paragraph',
            text: 'Платформа не обязана раскрывать партнёру либо заявителю внутренние материалы проверки, внутренние процедуры принятия решений либо информацию, полученную от третьих лиц.',
          },
        ],
      },
      {
        heading: '10. Меры воздействия и нарушения',
        blocks: [
          {
            type: 'paragraph',
            text: 'В случае нарушения настоящих Правил, Terms of Use, опубликованных специальных условий либо иных документов платформы KYLYVNYK CLUB вправе применять одну или несколько следующих мер:',
          },
          {
            type: 'list',
            items: [
              'предупреждение',
              'запрос на исправление нарушения',
              'временное скрытие специального предложения',
              'временное скрытие бизнес-профиля',
              'ограничение отдельных функций платформы',
              'приостановление статуса партнёра',
              'удаление бизнес-профиля',
              'отказ в дальнейшем размещении на платформе',
            ],
          },
          {
            type: 'paragraph',
            text: 'Выбор конкретной меры осуществляется исключительно по усмотрению KYLYVNYK CLUB с учётом характера нарушения, его последствий и иных обстоятельств.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB вправе применять указанные меры как временно, так и на неопределённый срок в зависимости от характера нарушения, степени риска для платформы, пользователей, партнёров и иных обстоятельств конкретного случая.',
          },
          {
            type: 'paragraph',
            text: 'Применение одной меры не ограничивает право платформы применить дополнительные меры в будущем.',
          },
          {
            type: 'paragraph',
            text: 'Указанные меры могут применяться без выплаты какой-либо компенсации партнёру в пределах, допускаемых применимым законодательством.',
          },
          {
            type: 'paragraph',
            text: 'Настоящие Правила не предусматривают договорных штрафов, финансовых санкций, гарантированной компенсации убытков либо обязательства платформы возмещать какие-либо расходы партнёра, связанные с применением мер воздействия.',
          },
        ],
      },
      {
        heading: '11. Отсутствие гарантий',
        blocks: [
          {
            type: 'paragraph',
            text: 'Участие в программе партнёров KYLYVNYK CLUB осуществляется на добровольной основе.',
          },
          { type: 'paragraph', text: 'KYLYVNYK CLUB не гарантирует партнёру:' },
          {
            type: 'list',
            items: [
              'получение клиентов',
              'получение заказов',
              'получение контрактов',
              'получение прибыли',
              'получение дохода',
              'увеличение продаж',
              'увеличение количества обращений',
              'окупаемость расходов',
              'достижение коммерческих результатов',
              'рост бизнеса',
              'определённое количество просмотров профиля',
              'определённое количество переходов',
              'определённое количество рекомендаций',
              'определённый уровень деловой активности',
              'сохранение специальных условий в будущем',
              'сохранение статуса партнёра',
              'сохранение размещения бизнес-профиля на платформе',
            ],
          },
          {
            type: 'paragraph',
            text: 'Любые результаты зависят от множества факторов, находящихся вне контроля платформы.',
          },
        ],
      },
      {
        heading: '12. Независимость партнёров',
        blocks: [
          { type: 'paragraph', text: 'Партнёры платформы являются независимыми третьими лицами.' },
          {
            type: 'paragraph',
            text: 'Участие в программе партнёров не создаёт между партнёром и KYLYVNYK CLUB отношений:',
          },
          {
            type: 'list',
            items: [
              'работодателя и работника',
              'агента и принципала',
              'представителя и доверителя',
              'партнёрства',
              'совместного предприятия',
              'франчайзинга',
              'коммерческого представительства',
              'дистрибьюторских отношений',
              'инвестиционных отношений',
              'иных отношений, прямо не предусмотренных документами платформы',
            ],
          },
          {
            type: 'paragraph',
            text: 'Партнёр не вправе делать заявления либо создавать впечатление, что он действует от имени KYLYVNYK CLUB.',
          },
          {
            type: 'paragraph',
            text: 'Партнёр не вправе использовать выражения «официальный представитель KYLYVNYK CLUB», «агент KYLYVNYK CLUB», «франчайзи KYLYVNYK CLUB», «сотрудник KYLYVNYK CLUB» либо иные аналогичные обозначения без предварительного письменного разрешения платформы.',
          },
          {
            type: 'paragraph',
            text: 'Партнёр не вправе принимать обязательства от имени платформы, заключать соглашения от имени платформы либо предоставлять какие-либо гарантии от имени платформы.',
          },
        ],
      },
      {
        heading: '13. Соблюдение законодательства',
        blocks: [
          {
            type: 'paragraph',
            text: 'Партнёр обязан соблюдать законодательство страны, региона либо территории, в которой он осуществляет деятельность.',
          },
          { type: 'paragraph', text: 'Партнёр самостоятельно несёт ответственность за:' },
          {
            type: 'list',
            items: [
              'лицензии',
              'разрешения',
              'регистрацию бизнеса',
              'налоги',
              'трудовые отношения',
              'защиту прав потребителей',
              'рекламу',
              'обработку персональных данных',
              'соблюдение санкционных ограничений',
              'соблюдение экспортного контроля',
              'соблюдение требований к маркировке товаров и услуг',
              'соблюдение отраслевых требований',
              'иные требования законодательства',
            ],
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB не несёт ответственности за несоблюдение партнёром требований законодательства.',
          },
        ],
      },
      {
        heading: '14. Интеллектуальная собственность',
        blocks: [
          {
            type: 'paragraph',
            text: 'Все права на бренд KYLYVNYK CLUB, бренд KYLYVNYK, логотипы, элементы фирменного стиля, дизайн платформы, цифровые клубные карты, рекламные материалы, тексты, изображения, базы данных и иные объекты интеллектуальной собственности принадлежат KYLYVNYK CLUB, Kylyvnyk Consulting LLC либо соответствующим правообладателям.',
          },
          {
            type: 'paragraph',
            text: 'Партнёр не вправе использовать бренд KYLYVNYK CLUB, бренд KYLYVNYK, логотипы либо иные объекты интеллектуальной собственности платформы без предварительного письменного разрешения.',
          },
          {
            type: 'paragraph',
            text: 'Размещение бизнес-профиля не предоставляет партнёру каких-либо прав на интеллектуальную собственность платформы.',
          },
          {
            type: 'paragraph',
            text: 'Партнёр может использовать предоставленные платформой маркетинговые материалы, логотипы, значки партнёра, баннеры либо иные материалы исключительно в объёме и порядке, прямо разрешённых KYLYVNYK CLUB.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB вправе в любое время отозвать ранее предоставленное разрешение на использование таких материалов.',
          },
          {
            type: 'paragraph',
            text: 'После получения уведомления об отзыве разрешения партнёр обязан в разумный срок прекратить использование соответствующих материалов, если иное не согласовано сторонами в письменной форме.',
          },
        ],
      },
      {
        heading: '15. Ограничение ответственности платформы',
        blocks: [
          {
            type: 'paragraph',
            text: 'В максимально допустимой законом степени KYLYVNYK CLUB, Kylyvnyk Consulting LLC, её владельцы, руководители, сотрудники, подрядчики, представители и аффилированные лица не несут ответственности за:',
          },
          {
            type: 'list',
            items: [
              'действия либо бездействие партнёров',
              'действия пользователей платформы',
              'коммерческие результаты деятельности партнёра',
              'потерю клиентов',
              'потерю прибыли',
              'потерю деловой репутации',
              'потерю данных',
              'упущенную выгоду',
              'косвенные убытки',
              'специальные убытки',
              'штрафные убытки',
              'случайные убытки',
              'потерю деловых возможностей',
              'прекращение участия партнёра в программе',
              'удаление либо скрытие бизнес-профиля',
              'изменение алгоритмов, функций либо возможностей платформы',
            ],
          },
          {
            type: 'paragraph',
            text: 'Настоящий раздел подлежит толкованию максимально широко в пределах, допускаемых применимым законодательством.',
          },
          {
            type: 'paragraph',
            text: 'Максимальная совокупная ответственность KYLYVNYK CLUB перед партнёром по любым требованиям, претензиям, спорам либо искам ограничивается суммой, фактически уплаченной партнёром платформе за последние три (3) календарных месяца, непосредственно предшествующих возникновению соответствующего требования.',
          },
          {
            type: 'paragraph',
            text: 'Если партнёр не осуществлял оплату услуг платформы в течение указанного периода, KYLYVNYK CLUB не несёт денежной ответственности в максимально допустимой законом степени.',
          },
        ],
      },
      {
        heading: '16. Прекращение участия партнёра',
        blocks: [
          {
            type: 'paragraph',
            text: 'Партнёр вправе прекратить участие в программе партнёров в любое время.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB вправе прекратить участие партнёра полностью либо частично в случаях:',
          },
          {
            type: 'list',
            items: [
              'нарушения настоящих Правил',
              'нарушения Terms of Use',
              'нарушения законодательства',
              'предоставления недостоверной информации',
              'жалоб пользователей',
              'отказа сотрудничать при проверках',
              'создания юридических, финансовых, операционных либо репутационных рисков для платформы',
              'нарушения специальных условий',
              'нарушения прав третьих лиц',
            ],
          },
          {
            type: 'paragraph',
            text: 'Прекращение участия может сопровождаться удалением, скрытием либо деактивацией бизнес-профиля.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB вправе сохранять архивные записи, историю взаимодействий, документы проверки, переписку, сведения о нарушениях и иную информацию, связанную с участием партнёра, в объёме, необходимом для соблюдения законодательства, разрешения споров, предотвращения мошенничества, обеспечения безопасности платформы и защиты законных интересов KYLYVNYK CLUB.',
          },
          {
            type: 'paragraph',
            text: 'Прекращение участия партнёра не создаёт обязанности платформы осуществлять возврат ранее уплаченных платежей, кроме случаев, прямо предусмотренных применимым законодательством либо отдельными письменными соглашениями между сторонами.',
          },
        ],
      },
      {
        heading: '17. Изменение правил',
        blocks: [
          { type: 'paragraph', text: 'KYLYVNYK CLUB вправе периодически изменять настоящие Partner Rules.' },
          {
            type: 'paragraph',
            text: 'Обновлённая редакция публикуется на платформе с указанием новой даты вступления в силу либо даты последнего обновления.',
          },
          {
            type: 'paragraph',
            text: 'Продолжение использования платформы после вступления изменений в силу означает согласие партнёра с обновлённой редакцией Правил в пределах, допускаемых применимым законодательством.',
          },
          {
            type: 'paragraph',
            text: 'Если партнёр не согласен с изменениями, он обязан прекратить участие в программе партнёров и использование соответствующих функций платформы.',
          },
        ],
      },
      {
        heading: '18. Полнота соглашения',
        blocks: [
          {
            type: 'paragraph',
            text: 'Настоящие Partner Rules являются частью общей юридической документации KYLYVNYK CLUB.',
          },
          {
            type: 'paragraph',
            text: 'Совместно с Terms of Use, Privacy Policy, Cookie Policy, Club Rules, Business Introduction Rules, Refund Policy, Disclaimer и иными официальными документами платформы настоящие Правила составляют полное соглашение между платформой и партнёром по вопросам участия в программе партнёров.',
          },
          {
            type: 'paragraph',
            text: 'В случае противоречия между настоящими Partner Rules и Terms of Use преимущественную силу имеют Terms of Use, если иное прямо не предусмотрено документами платформы.',
          },
        ],
      },
      {
        heading: '19. Контактная информация',
        blocks: [
          { type: 'paragraph', text: 'KYLYVNYK CLUB' },
          { type: 'paragraph', text: 'Управляется компанией:' },
          { type: 'paragraph', text: 'Kylyvnyk Consulting LLC' },
          { type: 'paragraph', text: 'Email: kylyvnykclub@gmail.com' },
          { type: 'paragraph', text: 'Почтовый адрес:' },
          { type: 'paragraph', text: '6 Pauline Pl' },
          { type: 'paragraph', text: 'Palm Coast, FL 32164-7535' },
          { type: 'paragraph', text: 'United States' },
          {
            type: 'paragraph',
            text: 'По вопросам, связанным с участием в программе партнёров, партнёр может обращаться по указанным контактным данным.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB вправе самостоятельно определять порядок, сроки и объём ответов на обращения партнёров, если иное не предусмотрено обязательными требованиями законодательства.',
          },
        ],
      },
    ],
    note: 'Настоящие Partner Rules могут переводиться на другие языки исключительно для удобства пользователей и партнёров. В случае любых расхождений, противоречий либо различий между переводами преимущественную юридическую силу имеет официальная английская версия документа.',
  },
  uk: {
    title: 'Правила партнерів',
    effectiveDate: '1 липня 2026 року',
    version: '1.0',
    operatorLines: ['Kylyvnyk Consulting LLC', 'Florida, United States'],
    sections: [
      {
        heading: '1. Загальні положення',
        blocks: [
          {
            type: 'paragraph',
            text: 'Ці Partner Rules ("Правила партнерів") регулюють участь бізнес-партнерів у платформі KYLYVNYK CLUB, порядок розміщення бізнес-профілів, публікації спеціальних умов, взаємодії з учасниками клубу та використання партнерських функцій платформи.',
          },
          { type: 'paragraph', text: 'Ці Правила є доповненням до:' },
          {
            type: 'list',
            items: [
              'Terms of Use',
              'Privacy Policy',
              'Cookie Policy',
              'інших офіційних документів KYLYVNYK CLUB',
            ],
          },
          {
            type: 'paragraph',
            text: 'У разі суперечності між цими Правилами та Terms of Use переважну силу мають Terms of Use, якщо інше прямо не передбачено цими Правилами.',
          },
          {
            type: 'paragraph',
            text: "Використання партнерських функцій платформи означає повну та безумовну згоду партнера з цими Правилами.",
          },
          {
            type: 'paragraph',
            text: "Якщо партнер не погоджується з цими Правилами, він зобов'язаний припинити використання партнерських функцій платформи.",
          },
        ],
      },
      {
        heading: '2. Хто може стати партнером',
        blocks: [
          { type: 'paragraph', text: 'Партнером KYLYVNYK CLUB можуть стати:' },
          {
            type: 'list',
            items: [
              'юридичні особи',
              'фізичні особи-підприємці',
              'самозайняті особи',
              'ліцензовані фахівці',
              'незалежні консультанти',
              'професійні організації',
              'некомерційні організації',
              'державні та муніципальні організації, якщо їхня участь допускається застосовним законодавством',
              'інші особи та організації, діяльність яких відповідає вимогам платформи',
            ],
          },
          {
            type: 'paragraph',
            text: 'Статус партнера надається виключно на розсуд KYLYVNYK CLUB.',
          },
          {
            type: 'paragraph',
            text: "Подання заявки на участь як партнера не створює обов'язку платформи схвалити таку заявку.",
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB має право відмовити у наданні статусу партнера без пояснення причин у межах, що допускаються застосовним законодавством.',
          },
        ],
      },
      {
        heading: '3. Вимоги до партнера',
        blocks: [
          { type: 'paragraph', text: "Партнер зобов'язаний:" },
          {
            type: 'list',
            items: [
              'здійснювати діяльність на законних підставах',
              'дотримуватися застосовного законодавства',
              'надавати достовірну, актуальну та повну інформацію',
              'своєчасно оновлювати інформацію',
              'не вводити користувачів в оману',
              'дотримуватися цих Правил',
              'дотримуватися Terms of Use платформи',
              'поважати права користувачів та інших партнерів',
              'діяти добросовісно під час взаємодії з учасниками клубу',
              'дотримуватися опублікованих спеціальних умов відповідно до цих Правил, Terms of Use та інших документів платформи',
            ],
          },
          { type: 'paragraph', text: 'Партнер не має права:' },
          {
            type: 'list',
            items: [
              'публікувати неправдиву або таку, що вводить в оману, інформацію',
              'використовувати шахрайські схеми',
              'приховувати істотні умови пропозицій',
              'публікувати завідомо недостовірні спеціальні умови',
              'видавати себе за представника KYLYVNYK CLUB',
              'використовувати бренд KYLYVNYK CLUB без дозволу платформи',
              'використовувати платформу для незаконної діяльності',
              'порушувати права третіх осіб',
              'здійснювати діяльність, здатну завдати шкоди платформі, її користувачам або іншим партнерам',
            ],
          },
          {
            type: 'paragraph',
            text: 'Партнер несе самостійну відповідальність за свою діяльність, товари, послуги, ліцензії, дозволи, ціни, гарантії, маркетингові матеріали та дотримання законодавства.',
          },
        ],
      },
      {
        heading: '4. Ліцензії та дозволи',
        blocks: [
          {
            type: 'paragraph',
            text: "Якщо діяльність партнера потребує ліцензій, дозволів, сертифікатів чи інших дозвільних документів, партнер зобов'язаний мати такі документи протягом усього періоду участі в платформі.",
          },
          {
            type: 'paragraph',
            text: "На запит KYLYVNYK CLUB партнер зобов'язаний надати документи, що підтверджують:",
          },
          {
            type: 'list',
            items: [
              'реєстрацію бізнесу',
              'право на провадження діяльності',
              'наявність ліцензій',
              'наявність дозволів',
              'наявність сертифікатів',
              'право представляти відповідний бізнес, організацію або підприємця',
            ],
          },
          {
            type: 'paragraph',
            text: "Партнер зобов'язується невідкладно повідомляти платформу про припинення дії ліцензій, дозволів чи інших документів, які можуть вплинути на законність його діяльності.",
          },
          {
            type: 'paragraph',
            text: 'Розміщення бізнес-профілю не означає, що KYLYVNYK CLUB перевірила, підтвердила чи гарантує наявність у партнера всіх необхідних ліцензій і дозволів.',
          },
        ],
      },
      {
        heading: '5. Перевірка бізнесу',
        blocks: [
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB має право здійснювати перевірку партнерів і бізнес-профілів до публікації, після публікації чи в будь-який момент використання платформи.',
          },
          { type: 'paragraph', text: 'Перевірка може включати:' },
          {
            type: 'list',
            items: [
              'аналіз документів, наданих партнером',
              'аналіз офіційних реєстрів',
              'аналіз ліцензій і дозволів',
              'аналіз веб-сайтів',
              'аналіз соціальних мереж',
              'аналіз публічної інформації',
              'аналіз відгуків і скарг',
              'аналіз інформації, отриманої від користувачів платформи',
              'інші законні методи перевірки',
            ],
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB має право використовувати автоматизовані та неавтоматизовані методи перевірки інформації.',
          },
          {
            type: 'paragraph',
            text: 'Проведення перевірки не означає схвалення, рекомендацію, сертифікацію чи гарантію якості діяльності партнера.',
          },
          {
            type: 'paragraph',
            text: "Платформа не зобов'язана здійснювати постійний моніторинг діяльності партнерів.",
          },
          {
            type: 'paragraph',
            text: 'Відсутність перевірки чи непроведення перевірки не означає схвалення, рекомендацію, гарантію, сертифікацію чи прийняття платформою відповідальності за діяльність партнера, його товари, послуги, ліцензії, дозволи чи дотримання законодавства.',
          },
          {
            type: 'paragraph',
            text: "Партнер зобов'язується співпрацювати з платформою під час перевірок і своєчасно надавати обґрунтовано запитувану інформацію.",
          },
          { type: 'paragraph', text: 'Відмова надати інформацію чи документи може призвести до:' },
          {
            type: 'list',
            items: [
              'відмови в публікації профілю',
              'приховування профілю',
              'обмеження окремих функцій',
              'призупинення статусу партнера',
              'припинення участі в програмі партнерів',
            ],
          },
        ],
      },
      {
        heading: '6. Бізнес-профілі',
        blocks: [
          {
            type: 'paragraph',
            text: 'Партнер може подати заявку на створення та розміщення бізнес-профілю на платформі KYLYVNYK CLUB.',
          },
          { type: 'paragraph', text: 'Бізнес-профіль може містити:' },
          {
            type: 'list',
            items: [
              'назву бізнесу',
              'опис діяльності',
              'логотипи',
              'фотографії',
              "контактну інформацію",
              'посилання на веб-сайти',
              'посилання на соціальні мережі',
              'інформацію про ліцензії та сертифікати',
              'спеціальні умови',
              'знижки',
              'бонуси',
              'територію обслуговування',
              'години роботи',
              "інформацію про способи зв'язку",
              'відомості про пропоновані товари та послуги',
              'інші відомості, що стосуються діяльності партнера',
            ],
          },
          { type: 'paragraph', text: 'Статуси бізнес-профілів можуть включати:' },
          {
            type: 'list',
            items: ['UNDER REVIEW', 'PUBLISHED', 'HIDDEN', 'SUSPENDED', 'REMOVED'],
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB має право на власний розсуд публікувати, відхиляти, приховувати, призупиняти або видаляти бізнес-профілі.',
          },
          {
            type: 'paragraph',
            text: "Публікація бізнес-профілю не є рекомендацією, сертифікацією, гарантією якості, ліцензуванням чи підтвердженням діяльності партнера з боку платформи.",
          },
          {
            type: 'paragraph',
            text: 'Партнер несе повну відповідальність за всю інформацію, розміщену в його бізнес-профілі.',
          },
          {
            type: 'paragraph',
            text: 'Партнер несе відповідальність за своєчасне оновлення такої інформації та за наслідки розміщення недостовірних, неповних, застарілих або таких, що вводять в оману, відомостей.',
          },
        ],
      },
      {
        heading: '7. Спеціальні умови партнерів',
        blocks: [
          {
            type: 'paragraph',
            text: 'Партнер має право розміщувати на платформі спеціальні умови, знижки, бонуси, акції, привілеї чи інші пропозиції для учасників клубу.',
          },
          {
            type: 'paragraph',
            text: "Кожен партнер самостійно визначає зміст своїх пропозицій і несе повну відповідальність за їх законність, достовірність, актуальність та виконання.",
          },
          {
            type: 'paragraph',
            text: "Партнер зобов'язується не публікувати спеціальні умови, знижки, бонуси чи інші пропозиції, які є завідомо неправдивими, такими, що вводять в оману, дискримінаційними, незаконними або об'єктивно нездійсненними.",
          },
          {
            type: 'paragraph',
            text: 'Якщо партнер розміщує, публікує чи підтверджує спеціальну умову на платформі KYLYVNYK CLUB, партнер зобов\'язується дотримуватися такої умови стосовно учасника клубу, який:',
          },
          {
            type: 'list',
            items: [
              'має чинну цифрову клубну картку',
              'відповідає вимогам пропозиції',
              'виконав умови відповідної пропозиції',
            ],
          },
          {
            type: 'paragraph',
            text: "Партнер не має права свавільно відмовляти учаснику клубу в наданні опублікованої спеціальної умови за умови дотримання учасником усіх вимог пропозиції.",
          },
          {
            type: 'paragraph',
            text: 'Якщо пропозиція містить обмеження, територіальні умови, строки дії, вимоги щодо попереднього запису, мінімальної суми замовлення, кількісні обмеження чи інші істотні умови, такі умови мають бути ясно та однозначно зазначені партнером.',
          },
          {
            type: 'paragraph',
            text: "Партнер зобов'язаний своєчасно оновлювати інформацію про спеціальні умови та невідкладно повідомляти платформу про припинення дії чи істотну зміну пропозиції.",
          },
          {
            type: 'paragraph',
            text: 'Систематичне порушення опублікованих спеціальних умов може бути підставою для застосування заходів, передбачених цими Правилами.',
          },
          {
            type: 'paragraph',
            text: "Незважаючи на положення цього розділу, KYLYVNYK CLUB не є гарантом виконання зобов'язань партнера і не несе відповідальності за відмову партнера надати товари, послуги, знижки, бонуси чи інші спеціальні умови.",
          },
        ],
      },
      {
        heading: '8. Обов\'язки партнера',
        blocks: [
          { type: 'paragraph', text: "Партнер зобов'язаний:" },
          {
            type: 'list',
            items: [
              'підтримувати актуальність інформації',
              'дотримуватися опублікованих спеціальних умов',
              'дотримуватися застосовного законодавства',
              'дотримуватися прав споживачів',
              'дотримуватися прав користувачів платформи',
              'надавати достовірну інформацію',
              'своєчасно відповідати на обґрунтовані запити платформи',
              'співпрацювати під час перевірок і розгляду скарг',
              'діяти добросовісно під час взаємодії з учасниками клубу',
              'не вводити користувачів в оману щодо своїх товарів, послуг, цін, ліцензій, дозволів чи спеціальних умов',
            ],
          },
          { type: 'paragraph', text: "Партнер зобов'язується невідкладно повідомляти платформу про:" },
          {
            type: 'list',
            items: [
              'припинення діяльності',
              'зміну власника бізнесу',
              'зміну ліцензій чи дозволів',
              'істотну зміну пропонованих товарів чи послуг',
              'припинення дії спеціальних умов',
              'зміну контактних даних',
              "інші обставини, здатні вплинути на користувачів платформи чи діяльність партнера на платформі",
            ],
          },
        ],
      },
      {
        heading: '9. Скарги учасників',
        blocks: [
          {
            type: 'paragraph',
            text: 'Учасники платформи мають право подавати скарги, звернення та повідомлення про можливі порушення з боку партнерів.',
          },
          { type: 'paragraph', text: "KYLYVNYK CLUB має право, але не зобов'язана:" },
          {
            type: 'list',
            items: [
              'розглядати вхідні звернення',
              'запитувати пояснення у партнерів',
              'запитувати документи та докази',
              'проводити внутрішню перевірку',
              'тимчасово приховувати спеціальні пропозиції на період перевірки',
              'тимчасово приховувати бізнес-профілі на період перевірки',
              'вживати заходів, передбачених цими Правилами',
            ],
          },
          {
            type: 'paragraph',
            text: "Платформа не зобов'язана виступати арбітром, посередником, представником чи захисником будь-якої сторони спору.",
          },
          {
            type: 'paragraph',
            text: 'Факт розгляду скарги не означає визнання вини партнера чи правоти заявника.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB має право приймати рішення на підставі інформації, яку платформа вважає обґрунтовано достатньою в конкретній ситуації.',
          },
          {
            type: 'paragraph',
            text: "Платформа не зобов'язана розкривати партнеру чи заявнику внутрішні матеріали перевірки, внутрішні процедури прийняття рішень чи інформацію, отриману від третіх осіб.",
          },
        ],
      },
      {
        heading: '10. Заходи впливу та порушення',
        blocks: [
          {
            type: 'paragraph',
            text: 'У разі порушення цих Правил, Terms of Use, опублікованих спеціальних умов чи інших документів платформи KYLYVNYK CLUB має право застосувати один або декілька з таких заходів:',
          },
          {
            type: 'list',
            items: [
              'попередження',
              'запит на усунення порушення',
              'тимчасове приховування спеціальної пропозиції',
              'тимчасове приховування бізнес-профілю',
              'обмеження окремих функцій платформи',
              'призупинення статусу партнера',
              'видалення бізнес-профілю',
              'відмову в подальшому розміщенні на платформі',
            ],
          },
          {
            type: 'paragraph',
            text: 'Вибір конкретного заходу здійснюється виключно на розсуд KYLYVNYK CLUB з урахуванням характеру порушення, його наслідків та інших обставин.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB має право застосовувати зазначені заходи як тимчасово, так і на невизначений строк залежно від характеру порушення, ступеня ризику для платформи, користувачів, партнерів та інших обставин конкретного випадку.',
          },
          {
            type: 'paragraph',
            text: "Застосування одного заходу не обмежує право платформи застосувати додаткові заходи в майбутньому.",
          },
          {
            type: 'paragraph',
            text: 'Зазначені заходи можуть застосовуватися без виплати будь-якої компенсації партнеру в межах, що допускаються застосовним законодавством.',
          },
          {
            type: 'paragraph',
            text: "Ці Правила не передбачають договірних штрафів, фінансових санкцій, гарантованого відшкодування збитків чи обов'язку платформи відшкодовувати будь-які витрати партнера, пов'язані із застосуванням заходів впливу.",
          },
        ],
      },
      {
        heading: '11. Відсутність гарантій',
        blocks: [
          {
            type: 'paragraph',
            text: 'Участь у програмі партнерів KYLYVNYK CLUB здійснюється на добровільній основі.',
          },
          { type: 'paragraph', text: 'KYLYVNYK CLUB не гарантує партнеру:' },
          {
            type: 'list',
            items: [
              'отримання клієнтів',
              'отримання замовлень',
              'отримання контрактів',
              'отримання прибутку',
              'отримання доходу',
              'збільшення продажів',
              'збільшення кількості звернень',
              'окупність витрат',
              'досягнення комерційних результатів',
              'зростання бізнесу',
              'певну кількість переглядів профілю',
              'певну кількість переходів',
              'певну кількість рекомендацій',
              'певний рівень ділової активності',
              'збереження спеціальних умов у майбутньому',
              'збереження статусу партнера',
              'збереження розміщення бізнес-профілю на платформі',
            ],
          },
          {
            type: 'paragraph',
            text: 'Будь-які результати залежать від численних факторів, що перебувають поза контролем платформи.',
          },
        ],
      },
      {
        heading: '12. Незалежність партнерів',
        blocks: [
          { type: 'paragraph', text: 'Партнери платформи є незалежними третіми особами.' },
          {
            type: 'paragraph',
            text: "Участь у програмі партнерів не створює між партнером та KYLYVNYK CLUB відносин:",
          },
          {
            type: 'list',
            items: [
              'роботодавця та працівника',
              'агента та принципала',
              'представника та довірителя',
              'партнерства',
              'спільного підприємства',
              'франчайзингу',
              'комерційного представництва',
              "дистриб'юторських відносин",
              'інвестиційних відносин',
              'інших відносин, прямо не передбачених документами платформи',
            ],
          },
          {
            type: 'paragraph',
            text: "Партнер не має права робити заяви чи створювати враження, що він діє від імені KYLYVNYK CLUB.",
          },
          {
            type: 'paragraph',
            text: 'Партнер не має права використовувати вирази «офіційний представник KYLYVNYK CLUB», «агент KYLYVNYK CLUB», «франчайзі KYLYVNYK CLUB», «співробітник KYLYVNYK CLUB» чи інші аналогічні позначення без попереднього письмового дозволу платформи.',
          },
          {
            type: 'paragraph',
            text: "Партнер не має права приймати зобов'язання від імені платформи, укладати угоди від імені платформи чи надавати будь-які гарантії від імені платформи.",
          },
        ],
      },
      {
        heading: '13. Дотримання законодавства',
        blocks: [
          {
            type: 'paragraph',
            text: "Партнер зобов'язаний дотримуватися законодавства країни, регіону чи території, в якій він здійснює діяльність.",
          },
          { type: 'paragraph', text: 'Партнер самостійно несе відповідальність за:' },
          {
            type: 'list',
            items: [
              'ліцензії',
              'дозволи',
              'реєстрацію бізнесу',
              'податки',
              'трудові відносини',
              'захист прав споживачів',
              'рекламу',
              'обробку персональних даних',
              'дотримання санкційних обмежень',
              'дотримання експортного контролю',
              'дотримання вимог до маркування товарів і послуг',
              'дотримання галузевих вимог',
              'інші вимоги законодавства',
            ],
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB не несе відповідальності за недотримання партнером вимог законодавства.',
          },
        ],
      },
      {
        heading: '14. Інтелектуальна власність',
        blocks: [
          {
            type: 'paragraph',
            text: "Усі права на бренд KYLYVNYK CLUB, бренд KYLYVNYK, логотипи, елементи фірмового стилю, дизайн платформи, цифрові клубні картки, рекламні матеріали, тексти, зображення, бази даних та інші об'єкти інтелектуальної власності належать KYLYVNYK CLUB, Kylyvnyk Consulting LLC або відповідним правовласникам.",
          },
          {
            type: 'paragraph',
            text: "Партнер не має права використовувати бренд KYLYVNYK CLUB, бренд KYLYVNYK, логотипи чи інші об'єкти інтелектуальної власності платформи без попереднього письмового дозволу.",
          },
          {
            type: 'paragraph',
            text: "Розміщення бізнес-профілю не надає партнеру жодних прав на інтелектуальну власність платформи.",
          },
          {
            type: 'paragraph',
            text: 'Партнер може використовувати надані платформою маркетингові матеріали, логотипи, значки партнера, банери чи інші матеріали виключно в обсязі та порядку, прямо дозволених KYLYVNYK CLUB.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB має право в будь-який час відкликати раніше наданий дозвіл на використання таких матеріалів.',
          },
          {
            type: 'paragraph',
            text: "Після отримання повідомлення про відкликання дозволу партнер зобов'язаний у розумний строк припинити використання відповідних матеріалів, якщо інше не погоджено сторонами у письмовій формі.",
          },
        ],
      },
      {
        heading: '15. Обмеження відповідальності платформи',
        blocks: [
          {
            type: 'paragraph',
            text: 'У максимально допустимому законом обсязі KYLYVNYK CLUB, Kylyvnyk Consulting LLC, її власники, керівники, працівники, підрядники, представники та афілійовані особи не несуть відповідальності за:',
          },
          {
            type: 'list',
            items: [
              'дії чи бездіяльність партнерів',
              'дії користувачів платформи',
              'комерційні результати діяльності партнера',
              'втрату клієнтів',
              'втрату прибутку',
              'втрату ділової репутації',
              'втрату даних',
              'упущену вигоду',
              'непрямі збитки',
              'спеціальні збитки',
              'штрафні збитки',
              'випадкові збитки',
              'втрату ділових можливостей',
              'припинення участі партнера в програмі',
              'видалення чи приховування бізнес-профілю',
              'зміну алгоритмів, функцій чи можливостей платформи',
            ],
          },
          {
            type: 'paragraph',
            text: 'Цей розділ підлягає тлумаченню максимально широко в межах, що допускаються застосовним законодавством.',
          },
          {
            type: 'paragraph',
            text: 'Максимальна сукупна відповідальність KYLYVNYK CLUB перед партнером за будь-якими вимогами, претензіями, спорами чи позовами обмежується сумою, фактично сплаченою партнером платформі за останні три (3) календарні місяці, що безпосередньо передують виникненню відповідної вимоги.',
          },
          {
            type: 'paragraph',
            text: 'Якщо партнер не здійснював оплату послуг платформи протягом зазначеного періоду, KYLYVNYK CLUB не несе грошової відповідальності в максимально допустимому законом обсязі.',
          },
        ],
      },
      {
        heading: '16. Припинення участі партнера',
        blocks: [
          {
            type: 'paragraph',
            text: 'Партнер має право припинити участь у програмі партнерів у будь-який час.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB має право припинити участь партнера повністю чи частково у випадках:',
          },
          {
            type: 'list',
            items: [
              'порушення цих Правил',
              'порушення Terms of Use',
              'порушення законодавства',
              'надання недостовірної інформації',
              'скарг користувачів',
              'відмови співпрацювати під час перевірок',
              'створення юридичних, фінансових, операційних чи репутаційних ризиків для платформи',
              'порушення спеціальних умов',
              'порушення прав третіх осіб',
            ],
          },
          {
            type: 'paragraph',
            text: 'Припинення участі може супроводжуватися видаленням, приховуванням чи деактивацією бізнес-профілю.',
          },
          {
            type: 'paragraph',
            text: "KYLYVNYK CLUB має право зберігати архівні записи, історію взаємодій, документи перевірки, листування, відомості про порушення та іншу інформацію, пов'язану з участю партнера, в обсязі, необхідному для дотримання законодавства, вирішення спорів, запобігання шахрайству, забезпечення безпеки платформи та захисту законних інтересів KYLYVNYK CLUB.",
          },
          {
            type: 'paragraph',
            text: 'Припинення участі партнера не створює обов\'язку платформи здійснювати повернення раніше сплачених платежів, крім випадків, прямо передбачених застосовним законодавством чи окремими письмовими угодами між сторонами.',
          },
        ],
      },
      {
        heading: '17. Зміна правил',
        blocks: [
          { type: 'paragraph', text: 'KYLYVNYK CLUB має право періодично змінювати ці Partner Rules.' },
          {
            type: 'paragraph',
            text: 'Оновлена редакція публікується на платформі із зазначенням нової дати набрання чинності або дати останнього оновлення.',
          },
          {
            type: 'paragraph',
            text: "Продовження використання платформи після набрання змінами чинності означає згоду партнера з оновленою редакцією Правил у межах, що допускаються застосовним законодавством.",
          },
          {
            type: 'paragraph',
            text: "Якщо партнер не погоджується зі змінами, він зобов'язаний припинити участь у програмі партнерів і використання відповідних функцій платформи.",
          },
        ],
      },
      {
        heading: '18. Повнота угоди',
        blocks: [
          {
            type: 'paragraph',
            text: 'Ці Partner Rules є частиною загальної юридичної документації KYLYVNYK CLUB.',
          },
          {
            type: 'paragraph',
            text: 'Разом із Terms of Use, Privacy Policy, Cookie Policy, Club Rules, Business Introduction Rules, Refund Policy, Disclaimer та іншими офіційними документами платформи ці Правила становлять повну угоду між платформою та партнером щодо участі в програмі партнерів.',
          },
          {
            type: 'paragraph',
            text: 'У разі суперечності між цими Partner Rules та Terms of Use переважну силу мають Terms of Use, якщо інше прямо не передбачено документами платформи.',
          },
        ],
      },
      {
        heading: '19. Контактна інформація',
        blocks: [
          { type: 'paragraph', text: 'KYLYVNYK CLUB' },
          { type: 'paragraph', text: 'Керується компанією:' },
          { type: 'paragraph', text: 'Kylyvnyk Consulting LLC' },
          { type: 'paragraph', text: 'Email: kylyvnykclub@gmail.com' },
          { type: 'paragraph', text: 'Поштова адреса:' },
          { type: 'paragraph', text: '6 Pauline Pl' },
          { type: 'paragraph', text: 'Palm Coast, FL 32164-7535' },
          { type: 'paragraph', text: 'United States' },
          {
            type: 'paragraph',
            text: "З питань, пов'язаних з участю у програмі партнерів, партнер може звертатися за зазначеними контактними даними.",
          },
          {
            type: 'paragraph',
            text: "KYLYVNYK CLUB має право самостійно визначати порядок, строки та обсяг відповідей на звернення партнерів, якщо інше не передбачено обов'язковими вимогами законодавства.",
          },
        ],
      },
    ],
    note: "Ці Partner Rules можуть перекладатися на інші мови виключно для зручності користувачів і партнерів. У разі будь-яких розбіжностей, суперечностей чи відмінностей між перекладами переважну юридичну силу має офіційна англомовна версія документа.",
  },
};
