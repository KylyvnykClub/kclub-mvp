import { LegalDocByLocale } from '@/features/legal/types';

export const clubRules: LegalDocByLocale = {
  en: {
    title: 'Club Rules',
    effectiveDate: 'July 1, 2026',
    version: '1.0',
    operatorLines: ['Kylyvnyk Consulting LLC', 'Florida, United States'],
    sections: [
      {
        heading: '1. GENERAL PROVISIONS',
        blocks: [
          {
            type: 'paragraph',
            text: 'These Club Rules ("Club Rules") govern participation by users in KYLYVNYK CLUB, use of the platform\'s functions, interaction with other members, use of the digital club card, participation in platform events, interaction with platform partners, participation in the Business Introductions system, and use of other services provided by KYLYVNYK CLUB.',
          },
          { type: 'paragraph', text: 'These Rules supplement:' },
          {
            type: 'list',
            items: [
              'Terms of Use;',
              'Privacy Policy;',
              'Cookie Policy;',
              'Partner Rules;',
              'Business Introduction Rules;',
              'Refund Policy;',
              'Disclaimer;',
              'other official documents of the platform.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Use of the platform constitutes the member\'s full and unconditional agreement with these Rules.',
          },
          {
            type: 'paragraph',
            text: 'If a member does not agree with these Rules, the member must stop using the platform.',
          },
          {
            type: 'paragraph',
            text: 'In the event of a conflict between these Rules and the Terms of Use, the Terms of Use shall prevail unless the platform\'s documents expressly provide otherwise.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB may change, limit, expand, or discontinue individual platform functions, participation programs, membership categories, services, events, and other platform features in accordance with the Terms of Use.',
          },
        ],
      },
      {
        heading: '2. WHO MAY BECOME A MEMBER',
        blocks: [
          {
            type: 'paragraph',
            text: 'Any individual who meets the platform\'s requirements and accepts the platform\'s documents may become a member of KYLYVNYK CLUB.',
          },
          {
            type: 'paragraph',
            text: 'Use of the platform is permitted only to persons who have reached the age of 18 or the age of majority established by the law of the user\'s country of residence.',
          },
          {
            type: 'paragraph',
            text: 'The platform may establish additional requirements for individual functions, programs, events, membership categories, or particular territories.',
          },
          {
            type: 'paragraph',
            text: 'The platform may introduce procedures for identity verification, confirmation of contact details, confirmation of place of residence, confirmation of country of residence, confirmation of user status, or other user-verification procedures.',
          },
          {
            type: 'paragraph',
            text: 'The platform may refuse registration or restrict access to individual platform functions in cases permitted by applicable law.',
          },
          {
            type: 'paragraph',
            text: 'Registration on the platform does not create an obligation for the platform to preserve the user\'s access to the platform indefinitely.',
          },
        ],
      },
      {
        heading: '3. PARTICIPATION CATEGORIES',
        blocks: [
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB may provide various participation categories, the scope of rights, privileges, restrictions, and functions of which are determined by the platform.',
          },
          { type: 'paragraph', text: 'Participation categories may include:' },
          {
            type: 'list',
            items: [
              'Free Member;',
              'VIP Member;',
              'other participation categories that may be introduced by the platform in the future.',
            ],
          },
          {
            type: 'paragraph',
            text: 'The platform may, at its own discretion, create new participation categories, change existing categories, merge them, split them, rename them, or discontinue individual participation programs.',
          },
          {
            type: 'paragraph',
            text: 'No participation category grants the user the right to demand the preservation of any particular functionality, status, or privileges in the future.',
          },
        ],
      },
      {
        heading: '3.1 FREE MEMBER',
        blocks: [
          {
            type: 'paragraph',
            text: 'Free Member is the basic participation category in KYLYVNYK CLUB.',
          },
          {
            type: 'paragraph',
            text: 'A member of this category may use the platform functions that are provided free of charge at the relevant time.',
          },
          { type: 'paragraph', text: 'Free Member functionality may include:' },
          {
            type: 'list',
            items: [
              'registration on the platform;',
              'creation of an account;',
              'obtaining a digital club card;',
              'use of the platform\'s core functions;',
              'browsing the partner catalog;',
              'viewing partners\' special offers;',
              'participation in open platform events;',
              'receiving platform informational materials;',
              'use of other free functions available at the time of using the platform.',
            ],
          },
          {
            type: 'paragraph',
            text: 'The platform may change, restrict, expand, or discontinue the provision of individual free functions at any time.',
          },
        ],
      },
      {
        heading: '3.2 VIP MEMBER',
        blocks: [
          { type: 'paragraph', text: 'VIP Member is an extended participation category.' },
          {
            type: 'paragraph',
            text: 'VIP Membership may be provided on a paid, free, promotional, trial, or other basis at the platform\'s discretion.',
          },
          {
            type: 'paragraph',
            text: 'A VIP Member may obtain access to additional platform functions, including:',
          },
          {
            type: 'list',
            items: [
              'the ability to apply to place a Business Profile;',
              'the ability to participate in the Business Introductions system;',
              'the ability to recommend clients to other members and platform partners;',
              'the ability to obtain additional tools for business interaction;',
              'access to closed groups;',
              'access to closed chats;',
              'participation in closed meetings;',
              'participation in business events;',
              'participation in educational events;',
              'participation in networking events;',
              'access to additional platform materials;',
              'access to additional platform functions;',
              'participation in special platform programs;',
              'participation in future VIP programs;',
              'other functions determined by the platform.',
            ],
          },
          {
            type: 'paragraph',
            text: 'For access to individual VIP functions, the platform may request confirmation of identity, contact details, country of residence, place of residence, business information, or other information that the platform reasonably considers necessary.',
          },
          {
            type: 'paragraph',
            text: 'Having VIP Member status does not mean automatic placement of a Business Profile.',
          },
          {
            type: 'paragraph',
            text: 'Placement of a Business Profile is carried out solely after verification and approval by the platform in accordance with the Partner Rules, the Terms of Use, and other platform documents.',
          },
          {
            type: 'paragraph',
            text: 'The platform may, at its own discretion, approve, reject, hide, restrict, or remove a Business Profile in accordance with the applicable rules of the platform.',
          },
          { type: 'paragraph', text: 'Having VIP Member status does not guarantee:' },
          {
            type: 'list',
            items: [
              'placement of a Business Profile;',
              'retention of a Business Profile;',
              'obtaining clients;',
              'obtaining orders;',
              'obtaining contracts;',
              'obtaining profit;',
              'obtaining income;',
              'obtaining recommendations;',
              'obtaining Business Introductions;',
              'obtaining discounts;',
              'obtaining special conditions;',
              'business development;',
              'achievement of commercial results;',
              'obtaining business opportunities;',
              'obtaining investments;',
              'obtaining partners;',
              'obtaining any specific number of inquiries or contacts.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Payment for VIP Membership provides access to additional platform functions but is not payment for clients, advertising, sales, leads, recommendations, deals, income, or any guaranteed commercial result.',
          },
          {
            type: 'paragraph',
            text: 'The composition and scope of VIP Member functions may be changed by the platform at any time.',
          },
          {
            type: 'paragraph',
            text: 'The platform may introduce additional participation levels, special programs, extended statuses, business statuses, regional programs, club programs, and other forms of participation at its own discretion.',
          },
        ],
      },
      {
        heading: '4. MEMBER CONDUCT RULES',
        blocks: [
          { type: 'paragraph', text: 'A member must:' },
          {
            type: 'list',
            items: [
              'comply with the law;',
              'comply with these Rules;',
              'respect other members of the platform;',
              'respect platform partners;',
              'use the platform in good faith;',
              'observe the rules of communication and business ethics;',
              'not create obstacles to the operation of the platform;',
              'not abuse the platform\'s functions;',
              'not use the platform for manipulation, artificially influencing the reputation of members or partners, publishing fake reviews, or other unfair practices.',
            ],
          },
          {
            type: 'paragraph',
            text: 'The member must independently evaluate any business, commercial, or other proposals received through the platform.',
          },
          {
            type: 'paragraph',
            text: 'The platform is not obligated to monitor all user actions and does not guarantee the accuracy of any information posted by members.',
          },
        ],
      },
      {
        heading: '5. ACCURACY OF INFORMATION',
        blocks: [
          {
            type: 'paragraph',
            text: 'The member undertakes to provide accurate, current, and complete information.',
          },
          {
            type: 'paragraph',
            text: 'The member must promptly update their data when it changes.',
          },
          { type: 'paragraph', text: 'The user may not:' },
          {
            type: 'list',
            items: [
              'use false information;',
              'impersonate another person;',
              'use someone else\'s data without permission;',
              'create fictitious accounts;',
              'create accounts on behalf of organizations without the necessary authority.',
            ],
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB may request documents or additional information to verify the user\'s identity or confirm the information provided.',
          },
          {
            type: 'paragraph',
            text: 'Such documents may include identity documents, proof of place of residence, contact details, photographs, video identity verification, business registration documents, or other information that the platform reasonably considers necessary.',
          },
          {
            type: 'paragraph',
            text: 'Refusal to provide reasonably requested information may result in restriction of individual platform functions or termination of access to the platform.',
          },
          {
            type: 'paragraph',
            text: 'Providing documents or undergoing verification does not mean approval, recommendation, guarantee, or acceptance by the platform of responsibility for the user\'s activities.',
          },
        ],
      },
      {
        heading: '6. MEMBER ACCOUNT',
        blocks: [
          {
            type: 'paragraph',
            text: 'The member is responsible for the security of their account.',
          },
          { type: 'paragraph', text: 'The member must:' },
          {
            type: 'list',
            items: [
              'use a strong password;',
              'keep login credentials confidential;',
              'promptly update contact information;',
              'keep information about country of residence, place of residence, and other data up to date, where such information is used by the platform;',
              'immediately notify the platform of any suspected unauthorized access.',
            ],
          },
          {
            type: 'paragraph',
            text: 'The member is responsible for actions performed through their account until the platform is notified of possible account compromise.',
          },
          {
            type: 'paragraph',
            text: 'The platform may temporarily restrict access to an account where there are indications of a security breach, fraud, abuse of platform functions, or other circumstances creating a risk to the platform, users, or partners.',
          },
        ],
      },
      {
        heading: '7. DIGITAL CLUB CARD',
        blocks: [
          {
            type: 'paragraph',
            text: 'The platform may provide members with a digital club card.',
          },
          {
            type: 'paragraph',
            text: 'The digital club card is intended solely for identifying the member within the platform and for using the functions available to the relevant participation category.',
          },
          { type: 'paragraph', text: 'The club card may contain:' },
          {
            type: 'list',
            items: [
              'the user\'s name;',
              'card number;',
              'member status;',
              'participation category;',
              'validity period;',
              'other information determined by the platform.',
            ],
          },
          { type: 'paragraph', text: 'The digital club card is not:' },
          {
            type: 'list',
            items: [
              'a bank card;',
              'a credit card;',
              'a debit card;',
              'a payment instrument;',
              'an electronic wallet;',
              'an investment product;',
              'a financial instrument.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Possession of the club card does not, by itself, guarantee discounts, special conditions, services, goods, or other benefits.',
          },
          {
            type: 'paragraph',
            text: 'The member must present a valid club card or otherwise confirm their member status in cases where this is required to obtain special conditions or access individual platform functions.',
          },
          {
            type: 'paragraph',
            text: 'The platform may change the appearance, format, functionality, and mechanism of use of the club card at any time.',
          },
        ],
      },
      {
        heading: '8. INTERACTION WITH PARTNERS',
        blocks: [
          { type: 'paragraph', text: 'The platform\'s partners are independent third parties.' },
          {
            type: 'paragraph',
            text: 'The member independently decides whether to interact with platform partners.',
          },
          {
            type: 'paragraph',
            text: 'Before purchasing goods or services, the member must independently assess:',
          },
          {
            type: 'list',
            items: [
              'the terms of the offer;',
              'the cost of goods and services;',
              'the presence of licenses and permits;',
              'the quality of goods and services;',
              'the partner\'s reputation;',
              'other material circumstances.',
            ],
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB is not a party to agreements between members and partners.',
          },
          { type: 'paragraph', text: 'The platform does not guarantee:' },
          {
            type: 'list',
            items: [
              'the availability of special conditions;',
              'the amount of discounts;',
              'the quality of goods;',
              'the quality of services;',
              'the availability of goods;',
              'the availability of services;',
              'performance of obligations by partners.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Any transactions between a member and a partner are carried out solely at the risk and responsibility of the relevant parties.',
          },
          {
            type: 'paragraph',
            text: 'The member is solely responsible for verifying the applicability of special conditions, the validity periods of offers, territorial restrictions, and other material terms of a specific offer.',
          },
        ],
      },
      {
        heading: '9. BUSINESS INTRODUCTIONS',
        blocks: [
          {
            type: 'paragraph',
            text: 'The platform may provide the opportunity to participate in the Business Introductions system.',
          },
          {
            type: 'paragraph',
            text: 'Business Introductions are intended to facilitate the establishment of business contacts between members and platform partners.',
          },
          { type: 'paragraph', text: 'Business Introductions may include:' },
          {
            type: 'list',
            items: [
              'exchange of contact information with the consent of the parties;',
              'introductions between members;',
              'business recommendations;',
              'participation in business events;',
              'other forms of business interaction.',
            ],
          },
          { type: 'paragraph', text: 'Business Introductions are not:' },
          {
            type: 'list',
            items: [
              'employment;',
              'agency activity;',
              'brokerage activity;',
              'investment activity;',
              'franchising;',
              'an MLM system;',
              'a guarantee of obtaining clients;',
              'a guarantee of obtaining income;',
              'a guarantee of concluding deals.',
            ],
          },
          {
            type: 'paragraph',
            text: 'The platform does not guarantee any results from participation in the Business Introductions system.',
          },
          {
            type: 'paragraph',
            text: 'Members independently decide whether to enter into business relations, negotiations, agreements, or any commercial actions after receiving a Business Introduction.',
          },
        ],
      },
      {
        heading: '10. COMPLAINTS AND INQUIRIES',
        blocks: [
          {
            type: 'paragraph',
            text: 'Members may send the platform complaints, inquiries, and reports of possible violations.',
          },
          { type: 'paragraph', text: 'KYLYVNYK CLUB may, but is not obligated to:' },
          {
            type: 'list',
            items: [
              'review inquiries;',
              'request additional information;',
              'conduct internal reviews;',
              'temporarily restrict individual platform functions during the review period;',
              'temporarily restrict access to individual sections of the platform during the review period;',
              'request explanations from members or partners;',
              'take measures provided for by the platform\'s documents.',
            ],
          },
          {
            type: 'paragraph',
            text: 'The platform is not obligated to act as an arbitrator, mediator, or representative of any party to a dispute.',
          },
          {
            type: 'paragraph',
            text: 'The fact that an inquiry has been reviewed does not mean an admission of anyone\'s rightness or fault.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB may make decisions based on information that the platform reasonably considers sufficient in a specific situation.',
          },
          {
            type: 'paragraph',
            text: 'The platform is not obligated to disclose internal review materials, internal decision-making procedures, or information received from third parties.',
          },
        ],
      },
      {
        heading: '11. PROHIBITED ACTIVITIES',
        blocks: [
          { type: 'paragraph', text: 'When using the platform, the member is prohibited from:' },
          {
            type: 'list',
            items: [
              'violating the law;',
              'using the platform for fraudulent purposes;',
              'posting false or misleading information;',
              'impersonating another person;',
              'using someone else\'s data without permission;',
              'creating fictitious accounts;',
              'using automated tools for unauthorized access to the platform;',
              'distributing malicious software;',
              'interfering with the operation of the platform;',
              'circumventing the platform\'s technical restrictions;',
              'using the platform to send spam;',
              'using the platform for mass solicitation of goods, services, investments, or other commercial offers without the recipients\' consent;',
              'posting illegal content;',
              'infringing intellectual property rights;',
              'using the platform for harassment, threats, discrimination, or other forms of unfair conduct;',
              'abusing the Business Introductions system;',
              'abusing partners\' special conditions;',
              'engaging in activity capable of causing harm to the platform, members, or partners.',
            ],
          },
        ],
      },
      {
        heading: '12. ENFORCEMENT MEASURES',
        blocks: [
          {
            type: 'paragraph',
            text: 'In the event of a violation of these Rules, the Terms of Use, or other platform documents, KYLYVNYK CLUB may apply one or more of the following measures:',
          },
          {
            type: 'list',
            items: [
              'a warning;',
              'a request to remedy the violation;',
              'restriction of individual platform functions;',
              'temporary restriction of access;',
              'temporary restriction of participation in individual programs;',
              'temporary restriction of the use of Business Introductions;',
              'temporary restriction of the use of special functions;',
              'restriction of access to individual participation categories;',
              'restriction of access to individual events, groups, or platform programs;',
              'suspension of member status;',
              'termination of access to individual sections of the platform;',
              'deletion of the account;',
              'refusal of re-registration.',
            ],
          },
          {
            type: 'paragraph',
            text: 'The choice of a specific measure is made solely at the platform\'s discretion, taking into account the nature of the violation, the degree of risk, and other circumstances of the specific situation.',
          },
          {
            type: 'paragraph',
            text: 'Application of one measure does not limit the platform\'s right to apply additional measures in the future.',
          },
        ],
      },
      {
        heading: '13. TERMINATION OF ACCESS',
        blocks: [
          { type: 'paragraph', text: 'The member may stop using the platform at any time.' },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB may restrict, suspend, or terminate a user\'s access, in whole or in part, in cases of:',
          },
          {
            type: 'list',
            items: [
              'violation of the platform\'s documents;',
              'violation of the law;',
              'providing inaccurate information;',
              'refusal to undergo identity verification or another check provided for by the platform\'s documents;',
              'complaints from users or partners;',
              'creation of legal, financial, operational, or reputational risks for the platform;',
              'abuse of the platform\'s functions;',
              'other circumstances that the platform reasonably considers sufficient to restrict access.',
            ],
          },
          {
            type: 'paragraph',
            text: 'The platform\'s decision to restrict or terminate access may be made for a specific period or indefinitely, depending on the circumstances of the specific case.',
          },
          {
            type: 'paragraph',
            text: 'Termination of access does not create an obligation for the platform to refund previously paid amounts, except in cases expressly provided for by applicable law.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB may retain archival records, interaction history, verification documents, and other information to the extent necessary to comply with the law, prevent fraud, resolve disputes, and protect the platform\'s legitimate interests.',
          },
        ],
      },
      {
        heading: '14. NO WARRANTIES',
        blocks: [
          {
            type: 'paragraph',
            text: 'The platform is provided on an "AS IS" and "AS AVAILABLE" basis.',
          },
          { type: 'paragraph', text: 'KYLYVNYK CLUB does not guarantee:' },
          {
            type: 'list',
            items: [
              'obtaining discounts;',
              'obtaining special conditions;',
              'obtaining clients;',
              'obtaining income;',
              'obtaining profit;',
              'obtaining orders;',
              'obtaining contracts;',
              'obtaining Business Introductions;',
              'business development;',
              'achievement of commercial results;',
              'preservation of any platform functions;',
              'continuous availability of the platform;',
              'absence of errors or technical failures;',
              'compatibility of the platform with any devices, software, or third-party services;',
              'preservation of data in the event of circumstances beyond the platform\'s reasonable control.',
            ],
          },
          {
            type: 'paragraph',
            text: 'The member uses the platform at their own risk.',
          },
        ],
      },
      {
        heading: '15. LIMITATION OF LIABILITY',
        blocks: [
          {
            type: 'paragraph',
            text: 'To the maximum extent permitted by law, KYLYVNYK CLUB, Kylyvnyk Consulting LLC, its owners, employees, contractors, representatives, and affiliates shall not be liable for:',
          },
          {
            type: 'list',
            items: [
              'acts or omissions of members;',
              'acts or omissions of partners;',
              'transactions between members and partners;',
              'loss of profit;',
              'loss of clients;',
              'loss of data;',
              'loss of business reputation;',
              'lost profits;',
              'indirect damages;',
              'special damages;',
              'punitive damages;',
              'incidental damages;',
              'loss of business opportunities;',
              'loss of potential clients;',
              'consequences of decisions made by a member based on information obtained through the platform.',
            ],
          },
          {
            type: 'paragraph',
            text: 'The platform\'s maximum aggregate liability to a member is limited to the amount actually paid by the member to the platform during the three (3) calendar months immediately preceding the event giving rise to the relevant claim.',
          },
          {
            type: 'paragraph',
            text: 'If the member has not paid for platform services during the specified period, the platform shall bear no monetary liability to the maximum extent permitted by law.',
          },
        ],
      },
      {
        heading: '16. COMPLIANCE WITH LAW',
        blocks: [
          {
            type: 'paragraph',
            text: 'The member must comply with the applicable law of their country of residence, the country in which they conduct their activities, and other jurisdictions whose law applies to the member\'s actions.',
          },
          {
            type: 'paragraph',
            text: 'The member is solely responsible for complying with legal requirements.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB does not provide legal, financial, investment, tax, accounting, or other professional advice.',
          },
        ],
      },
      {
        heading: '17. AMENDMENT OF RULES',
        blocks: [
          { type: 'paragraph', text: 'KYLYVNYK CLUB may periodically amend these Club Rules.' },
          {
            type: 'paragraph',
            text: 'The updated version is published on the platform indicating the new effective date or the date of the last update.',
          },
          {
            type: 'paragraph',
            text: 'Continued use of the platform after the amendments take effect constitutes the member\'s agreement with the updated version of the Rules to the extent permitted by applicable law.',
          },
          {
            type: 'paragraph',
            text: 'If the member does not agree with the amendments, the member must stop using the platform.',
          },
        ],
      },
      {
        heading: '18. ENTIRE AGREEMENT',
        blocks: [
          {
            type: 'paragraph',
            text: 'These Club Rules are part of the general legal documentation of KYLYVNYK CLUB.',
          },
          {
            type: 'paragraph',
            text: 'Together with the Terms of Use, Privacy Policy, Cookie Policy, Partner Rules, Business Introduction Rules, Refund Policy, Disclaimer, and other official platform documents, these Rules constitute the entire agreement between the member and the platform regarding the use of the platform.',
          },
          {
            type: 'paragraph',
            text: 'In the event of a conflict between these Club Rules and the Terms of Use, the Terms of Use shall prevail unless the platform\'s documents expressly provide otherwise.',
          },
        ],
      },
      {
        heading: '19. CONTACT INFORMATION',
        blocks: [
          { type: 'paragraph', text: 'KYLYVNYK CLUB' },
          { type: 'paragraph', text: 'Operated by:' },
          { type: 'paragraph', text: 'Kylyvnyk Consulting LLC' },
          { type: 'paragraph', text: 'Email:' },
          { type: 'paragraph', text: 'kylyvnykclub@gmail.com' },
          { type: 'paragraph', text: 'Mailing address:' },
          { type: 'paragraph', text: '6 Pauline Pl' },
          { type: 'paragraph', text: 'Palm Coast, FL 32164-7535' },
          { type: 'paragraph', text: 'United States' },
          {
            type: 'paragraph',
            text: 'For questions related to the use of the platform, the member may contact the platform using the contact details above.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB may independently determine the procedure, timing, and scope of responses to member inquiries, unless otherwise required by mandatory legal requirements.',
          },
        ],
      },
    ],
    note: 'This document may be translated into other languages for the convenience of users. In the event of any discrepancy, conflict, or difference between translations, the official English-language version of this document shall prevail.',
  },
  ru: {
    title: 'Правила клуба',
    effectiveDate: '1 июля 2026 года',
    version: '1.0',
    operatorLines: ['Kylyvnyk Consulting LLC', 'Florida, United States'],
    sections: [
      {
        heading: '1. ОБЩИЕ ПОЛОЖЕНИЯ',
        blocks: [
          {
            type: 'paragraph',
            text: 'Настоящие Club Rules («Правила клуба») регулируют участие пользователей в KYLYVNYK CLUB, использование функций платформы, взаимодействие с другими участниками, использование цифровой клубной карты, участие в мероприятиях платформы, взаимодействие с партнёрами платформы, участие в системе Business Introductions и использование иных сервисов, предоставляемых KYLYVNYK CLUB.',
          },
          { type: 'paragraph', text: 'Настоящие Правила являются дополнением к:' },
          {
            type: 'list',
            items: [
              'Terms of Use;',
              'Privacy Policy;',
              'Cookie Policy;',
              'Partner Rules;',
              'Business Introduction Rules;',
              'Refund Policy;',
              'Disclaimer;',
              'иным официальным документам платформы.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Использование платформы означает полное и безусловное согласие участника с настоящими Правилами.',
          },
          {
            type: 'paragraph',
            text: 'Если участник не согласен с настоящими Правилами, он обязан прекратить использование платформы.',
          },
          {
            type: 'paragraph',
            text: 'В случае противоречия между настоящими Правилами и Terms of Use преимущественную силу имеют Terms of Use, если иное прямо не предусмотрено документами платформы.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB вправе изменять, ограничивать, расширять либо прекращать отдельные функции платформы, программы участия, категории членства, сервисы, мероприятия и иные возможности платформы в соответствии с Terms of Use.',
          },
        ],
      },
      {
        heading: '2. КТО МОЖЕТ БЫТЬ УЧАСТНИКОМ',
        blocks: [
          {
            type: 'paragraph',
            text: 'Участником KYLYVNYK CLUB может стать любое физическое лицо, которое соответствует требованиям платформы и принимает условия документов платформы.',
          },
          {
            type: 'paragraph',
            text: 'Использование платформы разрешено только лицам, достигшим 18-летнего возраста либо возраста совершеннолетия, установленного законодательством страны проживания пользователя.',
          },
          {
            type: 'paragraph',
            text: 'Платформа вправе устанавливать дополнительные требования для отдельных функций, программ, мероприятий, категорий участия либо отдельных территорий.',
          },
          {
            type: 'paragraph',
            text: 'Платформа вправе вводить процедуры проверки личности, подтверждения контактных данных, подтверждения адреса проживания, подтверждения страны проживания, подтверждения статуса пользователя либо иные процедуры проверки пользователя.',
          },
          {
            type: 'paragraph',
            text: 'Платформа вправе отказать в регистрации либо ограничить доступ к отдельным функциям платформы в случаях, допускаемых применимым законодательством.',
          },
          {
            type: 'paragraph',
            text: 'Регистрация на платформе не создаёт обязанности платформы сохранять доступ пользователя к платформе бессрочно.',
          },
        ],
      },
      {
        heading: '3. КАТЕГОРИИ УЧАСТИЯ',
        blocks: [
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB может предоставлять различные категории участия, объём прав, привилегий, ограничений и функций которых определяется платформой.',
          },
          { type: 'paragraph', text: 'Категории участия могут включать:' },
          {
            type: 'list',
            items: [
              'Free Member;',
              'VIP Member;',
              'иные категории участия, которые могут вводиться платформой в будущем.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Платформа вправе по собственному усмотрению создавать новые категории участия, изменять существующие категории, объединять их, разделять, переименовывать либо прекращать отдельные программы участия.',
          },
          {
            type: 'paragraph',
            text: 'Ни одна категория участия не предоставляет пользователю права требовать сохранения определённого функционала, статуса либо привилегий в будущем.',
          },
        ],
      },
      {
        heading: '3.1 FREE MEMBER',
        blocks: [
          { type: 'paragraph', text: 'Free Member является базовой категорией участия в KYLYVNYK CLUB.' },
          {
            type: 'paragraph',
            text: 'Участник данной категории может использовать функции платформы, которые на соответствующий момент предоставляются бесплатно.',
          },
          { type: 'paragraph', text: 'Функциональность Free Member может включать:' },
          {
            type: 'list',
            items: [
              'регистрацию на платформе;',
              'создание учётной записи;',
              'получение цифровой клубной карты;',
              'использование основных функций платформы;',
              'просмотр каталога партнёров;',
              'просмотр специальных условий партнёров;',
              'участие в открытых мероприятиях платформы;',
              'получение информационных материалов платформы;',
              'использование иных бесплатных функций, доступных на момент использования платформы.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Платформа вправе изменять, ограничивать, расширять либо прекращать предоставление отдельных бесплатных функций в любое время.',
          },
        ],
      },
      {
        heading: '3.2 VIP MEMBER',
        blocks: [
          { type: 'paragraph', text: 'VIP Member является расширенной категорией участия.' },
          {
            type: 'paragraph',
            text: 'VIP Membership может предоставляться на платной, бесплатной, акционной, тестовой либо иной основе по усмотрению платформы.',
          },
          {
            type: 'paragraph',
            text: 'VIP Member может получать доступ к дополнительным функциям платформы, включая:',
          },
          {
            type: 'list',
            items: [
              'возможность подачи заявки на размещение бизнес-профиля;',
              'возможность участия в системе Business Introductions;',
              'возможность рекомендовать клиентов другим участникам и партнёрам платформы;',
              'возможность получения дополнительных инструментов для делового взаимодействия;',
              'доступ к закрытым группам;',
              'доступ к закрытым чатам;',
              'участие в закрытых встречах;',
              'участие в деловых мероприятиях;',
              'участие в образовательных мероприятиях;',
              'участие в сетевых мероприятиях (networking events);',
              'доступ к дополнительным материалам платформы;',
              'доступ к дополнительным функциям платформы;',
              'участие в специальных программах платформы;',
              'участие в будущих VIP-программах;',
              'иные функции, определяемые платформой.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Для доступа к отдельным VIP-функциям платформа вправе запросить подтверждение личности, контактных данных, страны проживания, адреса проживания, информации о бизнесе либо иных сведений, которые платформа разумно считает необходимыми.',
          },
          {
            type: 'paragraph',
            text: 'Наличие статуса VIP Member не означает автоматическое размещение бизнес-профиля.',
          },
          {
            type: 'paragraph',
            text: 'Размещение бизнес-профиля осуществляется исключительно после проверки и одобрения платформой в соответствии с Partner Rules, Terms of Use и иными документами платформы.',
          },
          {
            type: 'paragraph',
            text: 'Платформа вправе по собственному усмотрению одобрить, отклонить, скрыть, ограничить либо удалить бизнес-профиль в соответствии с применимыми правилами платформы.',
          },
          { type: 'paragraph', text: 'Наличие статуса VIP Member не гарантирует:' },
          {
            type: 'list',
            items: [
              'размещение бизнес-профиля;',
              'сохранение бизнес-профиля;',
              'получение клиентов;',
              'получение заказов;',
              'получение контрактов;',
              'получение прибыли;',
              'получение дохода;',
              'получение рекомендаций;',
              'получение Business Introductions;',
              'получение скидок;',
              'получение специальных условий;',
              'развитие бизнеса;',
              'достижение коммерческих результатов;',
              'получение деловых возможностей;',
              'получение инвестиций;',
              'получение партнёров;',
              'получение определённого количества обращений либо контактов.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Оплата VIP Membership предоставляет доступ к дополнительным функциям платформы, но не является оплатой за клиентов, рекламу, продажи, лиды, рекомендации, сделки, доход либо гарантированный коммерческий результат.',
          },
          {
            type: 'paragraph',
            text: 'Состав и объём функций VIP Member могут изменяться платформой в любое время.',
          },
          {
            type: 'paragraph',
            text: 'Платформа вправе вводить дополнительные уровни участия, специальные программы, расширенные статусы, бизнес-статусы, региональные программы, клубные программы и иные формы участия по собственному усмотрению.',
          },
        ],
      },
      {
        heading: '4. ПРАВИЛА ПОВЕДЕНИЯ УЧАСТНИКОВ',
        blocks: [
          { type: 'paragraph', text: 'Участник обязан:' },
          {
            type: 'list',
            items: [
              'соблюдать законодательство;',
              'соблюдать настоящие Правила;',
              'уважать других участников платформы;',
              'уважать партнёров платформы;',
              'использовать платформу добросовестно;',
              'соблюдать правила общения и деловой этики;',
              'не создавать помех для работы платформы;',
              'не злоупотреблять функциями платформы;',
              'не использовать платформу для манипуляций, искусственного влияния на репутацию участников либо партнёров, публикации фиктивных отзывов либо иных недобросовестных практик.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Участник обязан самостоятельно оценивать любые деловые, коммерческие либо иные предложения, полученные через платформу.',
          },
          {
            type: 'paragraph',
            text: 'Платформа не обязана контролировать все действия пользователей и не гарантирует достоверность любой информации, размещённой участниками.',
          },
        ],
      },
      {
        heading: '5. ДОСТОВЕРНОСТЬ ИНФОРМАЦИИ',
        blocks: [
          {
            type: 'paragraph',
            text: 'Участник обязуется предоставлять достоверную, актуальную и полную информацию.',
          },
          {
            type: 'paragraph',
            text: 'Участник обязан своевременно обновлять свои данные при их изменении.',
          },
          { type: 'paragraph', text: 'Пользователь не вправе:' },
          {
            type: 'list',
            items: [
              'использовать ложные сведения;',
              'выдавать себя за другое лицо;',
              'использовать чужие данные без разрешения;',
              'создавать фиктивные аккаунты;',
              'создавать аккаунты от имени организаций без необходимых полномочий.',
            ],
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB вправе запросить документы либо дополнительную информацию для проверки личности пользователя либо подтверждения предоставленных сведений.',
          },
          {
            type: 'paragraph',
            text: 'Такие документы могут включать документы, удостоверяющие личность, подтверждение адреса проживания, контактные данные, фотографии, видеоподтверждение личности, документы о регистрации бизнеса либо иные сведения, которые платформа разумно считает необходимыми.',
          },
          {
            type: 'paragraph',
            text: 'Отказ предоставить разумно запрашиваемую информацию может привести к ограничению отдельных функций платформы либо прекращению доступа к платформе.',
          },
          {
            type: 'paragraph',
            text: 'Предоставление документов либо прохождение проверки не означает одобрение, рекомендацию, гарантию либо принятие платформой ответственности за деятельность пользователя.',
          },
        ],
      },
      {
        heading: '6. АККАУНТ УЧАСТНИКА',
        blocks: [
          { type: 'paragraph', text: 'Участник несёт ответственность за безопасность своей учётной записи.' },
          { type: 'paragraph', text: 'Участник обязан:' },
          {
            type: 'list',
            items: [
              'использовать надёжный пароль;',
              'обеспечивать конфиденциальность данных для входа;',
              'своевременно обновлять контактную информацию;',
              'поддерживать актуальность сведений о стране проживания, адресе проживания и иных данных, если такие сведения используются платформой;',
              'незамедлительно уведомлять платформу о подозрении на несанкционированный доступ.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Участник несёт ответственность за действия, совершённые через его учётную запись до момента уведомления платформы о возможном компрометировании аккаунта.',
          },
          {
            type: 'paragraph',
            text: 'Платформа вправе временно ограничить доступ к аккаунту при наличии признаков нарушения безопасности, мошенничества, злоупотребления функциями платформы либо иных обстоятельств, создающих риск для платформы, пользователей или партнёров.',
          },
        ],
      },
      {
        heading: '7. ЦИФРОВАЯ КЛУБНАЯ КАРТА',
        blocks: [
          { type: 'paragraph', text: 'Платформа может предоставлять участникам цифровую клубную карту.' },
          {
            type: 'paragraph',
            text: 'Цифровая клубная карта предназначена исключительно для идентификации участника в рамках платформы и использования функций, доступных соответствующей категории участия.',
          },
          { type: 'paragraph', text: 'Клубная карта может содержать:' },
          {
            type: 'list',
            items: [
              'имя пользователя;',
              'номер карты;',
              'статус участника;',
              'категорию участия;',
              'срок действия;',
              'иные сведения, определяемые платформой.',
            ],
          },
          { type: 'paragraph', text: 'Цифровая клубная карта не является:' },
          {
            type: 'list',
            items: [
              'банковской картой;',
              'кредитной картой;',
              'дебетовой картой;',
              'платёжным инструментом;',
              'электронным кошельком;',
              'инвестиционным продуктом;',
              'финансовым инструментом.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Наличие клубной карты само по себе не гарантирует получение скидок, специальных условий, услуг, товаров либо иных преимуществ.',
          },
          {
            type: 'paragraph',
            text: 'Участник обязан предъявлять действительную клубную карту либо иным способом подтверждать свой статус участника в случаях, когда это требуется для получения специальных условий либо доступа к отдельным функциям платформы.',
          },
          {
            type: 'paragraph',
            text: 'Платформа вправе изменять внешний вид, формат, функциональность и механизм использования клубной карты в любое время.',
          },
        ],
      },
      {
        heading: '8. ВЗАИМОДЕЙСТВИЕ С ПАРТНЁРАМИ',
        blocks: [
          { type: 'paragraph', text: 'Партнёры платформы являются независимыми третьими лицами.' },
          {
            type: 'paragraph',
            text: 'Участник самостоятельно принимает решение о взаимодействии с партнёрами платформы.',
          },
          {
            type: 'paragraph',
            text: 'Перед приобретением товаров либо услуг участник обязан самостоятельно оценить:',
          },
          {
            type: 'list',
            items: [
              'условия предложения;',
              'стоимость товаров и услуг;',
              'наличие лицензий и разрешений;',
              'качество товаров и услуг;',
              'репутацию партнёра;',
              'иные существенные обстоятельства.',
            ],
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB не является стороной договоров между участниками и партнёрами.',
          },
          { type: 'paragraph', text: 'Платформа не гарантирует:' },
          {
            type: 'list',
            items: [
              'наличие специальных условий;',
              'размер скидок;',
              'качество товаров;',
              'качество услуг;',
              'наличие товаров;',
              'наличие услуг;',
              'исполнение обязательств партнёрами.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Любые сделки между участником и партнёром осуществляются исключительно на риск и ответственность соответствующих сторон.',
          },
          {
            type: 'paragraph',
            text: 'Участник самостоятельно несёт ответственность за проверку применимости специальных условий, сроков действия предложений, территориальных ограничений и иных существенных условий конкретного предложения.',
          },
        ],
      },
      {
        heading: '9. BUSINESS INTRODUCTIONS',
        blocks: [
          {
            type: 'paragraph',
            text: 'Платформа может предоставлять возможность участия в системе Business Introductions.',
          },
          {
            type: 'paragraph',
            text: 'Business Introductions предназначены для содействия установлению деловых контактов между участниками и партнёрами платформы.',
          },
          { type: 'paragraph', text: 'Business Introductions могут включать:' },
          {
            type: 'list',
            items: [
              'обмен контактной информацией с согласия сторон;',
              'знакомство участников;',
              'рекомендации делового характера;',
              'участие в деловых мероприятиях;',
              'иные формы делового взаимодействия.',
            ],
          },
          { type: 'paragraph', text: 'Business Introductions не являются:' },
          {
            type: 'list',
            items: [
              'трудоустройством;',
              'агентской деятельностью;',
              'брокерской деятельностью;',
              'инвестиционной деятельностью;',
              'франчайзингом;',
              'MLM-системой;',
              'гарантией получения клиентов;',
              'гарантией получения дохода;',
              'гарантией заключения сделок.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Платформа не гарантирует какие-либо результаты участия в системе Business Introductions.',
          },
          {
            type: 'paragraph',
            text: 'Участники самостоятельно принимают решения о вступлении в деловые отношения, переговорах, заключении соглашений либо осуществлении любых коммерческих действий после получения Business Introduction.',
          },
        ],
      },
      {
        heading: '10. ЖАЛОБЫ И ОБРАЩЕНИЯ',
        blocks: [
          {
            type: 'paragraph',
            text: 'Участники вправе направлять платформе жалобы, обращения и сообщения о возможных нарушениях.',
          },
          { type: 'paragraph', text: 'KYLYVNYK CLUB вправе, но не обязан:' },
          {
            type: 'list',
            items: [
              'рассматривать обращения;',
              'запрашивать дополнительную информацию;',
              'проводить внутренние проверки;',
              'временно ограничивать отдельные функции платформы на период проверки;',
              'временно ограничивать доступ к отдельным разделам платформы на период проверки;',
              'запрашивать объяснения у участников либо партнёров;',
              'принимать меры, предусмотренные документами платформы.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Платформа не обязана выступать арбитром, посредником либо представителем какой-либо стороны спора.',
          },
          {
            type: 'paragraph',
            text: 'Факт рассмотрения обращения не означает признание чьей-либо правоты либо вины.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB вправе принимать решения на основании информации, которую платформа считает разумно достаточной в конкретной ситуации.',
          },
          {
            type: 'paragraph',
            text: 'Платформа не обязана раскрывать внутренние материалы проверки, внутренние процедуры принятия решений либо информацию, полученную от третьих лиц.',
          },
        ],
      },
      {
        heading: '11. ЗАПРЕЩЁННАЯ ДЕЯТЕЛЬНОСТЬ',
        blocks: [
          { type: 'paragraph', text: 'При использовании платформы участнику запрещается:' },
          {
            type: 'list',
            items: [
              'нарушать законодательство;',
              'использовать платформу в мошеннических целях;',
              'размещать ложную либо вводящую в заблуждение информацию;',
              'выдавать себя за другое лицо;',
              'использовать чужие данные без разрешения;',
              'создавать фиктивные аккаунты;',
              'использовать автоматизированные средства для несанкционированного доступа к платформе;',
              'распространять вредоносное программное обеспечение;',
              'вмешиваться в работу платформы;',
              'обходить технические ограничения платформы;',
              'использовать платформу для рассылки спама;',
              'использовать платформу для массового навязывания товаров, услуг, инвестиций либо иных коммерческих предложений без согласия получателей;',
              'публиковать незаконный контент;',
              'нарушать права интеллектуальной собственности;',
              'использовать платформу для преследования, угроз, дискриминации либо иных форм недобросовестного поведения;',
              'злоупотреблять системой Business Introductions;',
              'злоупотреблять специальными условиями партнёров;',
              'осуществлять деятельность, способную причинить ущерб платформе, участникам либо партнёрам.',
            ],
          },
        ],
      },
      {
        heading: '12. МЕРЫ ВОЗДЕЙСТВИЯ',
        blocks: [
          {
            type: 'paragraph',
            text: 'В случае нарушения настоящих Правил, Terms of Use либо иных документов платформы KYLYVNYK CLUB вправе применять одну или несколько следующих мер:',
          },
          {
            type: 'list',
            items: [
              'предупреждение;',
              'запрос на устранение нарушения;',
              'ограничение отдельных функций платформы;',
              'временное ограничение доступа;',
              'временное ограничение участия в отдельных программах;',
              'временное ограничение использования Business Introductions;',
              'временное ограничение использования специальных функций;',
              'ограничение доступа к отдельным категориям участия;',
              'ограничение доступа к отдельным мероприятиям, группам либо программам платформы;',
              'приостановление статуса участника;',
              'прекращение доступа к отдельным разделам платформы;',
              'удаление аккаунта;',
              'отказ в повторной регистрации.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Выбор конкретной меры осуществляется исключительно по усмотрению платформы с учётом характера нарушения, степени риска и иных обстоятельств конкретной ситуации.',
          },
          {
            type: 'paragraph',
            text: 'Применение одной меры не ограничивает право платформы применить дополнительные меры в будущем.',
          },
        ],
      },
      {
        heading: '13. ПРЕКРАЩЕНИЕ ДОСТУПА',
        blocks: [
          { type: 'paragraph', text: 'Участник вправе прекратить использование платформы в любое время.' },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB вправе ограничить, приостановить либо прекратить доступ пользователя полностью либо частично в случаях:',
          },
          {
            type: 'list',
            items: [
              'нарушения документов платформы;',
              'нарушения законодательства;',
              'предоставления недостоверной информации;',
              'отказа пройти проверку личности либо иную проверку, предусмотренную документами платформы;',
              'жалоб пользователей либо партнёров;',
              'создания юридических, финансовых, операционных либо репутационных рисков для платформы;',
              'злоупотребления функциями платформы;',
              'иных обстоятельств, которые платформа разумно считает достаточными для ограничения доступа.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Решение платформы об ограничении либо прекращении доступа может приниматься как на определённый срок, так и бессрочно в зависимости от обстоятельств конкретного случая.',
          },
          {
            type: 'paragraph',
            text: 'Прекращение доступа не создаёт обязанности платформы осуществлять возврат ранее уплаченных платежей, кроме случаев, прямо предусмотренных применимым законодательством.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB вправе сохранять архивные записи, историю взаимодействий, документы проверки и иную информацию в объёме, необходимом для соблюдения законодательства, предотвращения мошенничества, разрешения споров и защиты законных интересов платформы.',
          },
        ],
      },
      {
        heading: '14. ОТСУТСТВИЕ ГАРАНТИЙ',
        blocks: [
          { type: 'paragraph', text: 'Платформа предоставляется по принципу «AS IS» и «AS AVAILABLE».' },
          { type: 'paragraph', text: 'KYLYVNYK CLUB не гарантирует:' },
          {
            type: 'list',
            items: [
              'получение скидок;',
              'получение специальных условий;',
              'получение клиентов;',
              'получение дохода;',
              'получение прибыли;',
              'получение заказов;',
              'получение контрактов;',
              'получение Business Introductions;',
              'развитие бизнеса;',
              'достижение коммерческих результатов;',
              'сохранение любых функций платформы;',
              'постоянную доступность платформы;',
              'отсутствие ошибок либо технических сбоев;',
              'совместимость платформы с любыми устройствами, программным обеспечением либо сторонними сервисами;',
              'сохранность данных в случае обстоятельств, находящихся вне разумного контроля платформы.',
            ],
          },
          { type: 'paragraph', text: 'Использование платформы осуществляется участником на собственный риск.' },
        ],
      },
      {
        heading: '15. ОГРАНИЧЕНИЕ ОТВЕТСТВЕННОСТИ',
        blocks: [
          {
            type: 'paragraph',
            text: 'В максимально допустимой законом степени KYLYVNYK CLUB, Kylyvnyk Consulting LLC, её владельцы, сотрудники, подрядчики, представители и аффилированные лица не несут ответственности за:',
          },
          {
            type: 'list',
            items: [
              'действия либо бездействие участников;',
              'действия либо бездействие партнёров;',
              'сделки между участниками и партнёрами;',
              'потерю прибыли;',
              'потерю клиентов;',
              'потерю данных;',
              'потерю деловой репутации;',
              'упущенную выгоду;',
              'косвенные убытки;',
              'специальные убытки;',
              'штрафные убытки;',
              'случайные убытки;',
              'потерю деловых возможностей;',
              'потерю потенциальных клиентов;',
              'последствия решений, принятых участником на основании информации, полученной через платформу.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Максимальная совокупная ответственность платформы перед участником ограничивается суммой, фактически уплаченной участником платформе за последние три (3) календарных месяца, непосредственно предшествующих возникновению соответствующего требования.',
          },
          {
            type: 'paragraph',
            text: 'Если участник не осуществлял оплату услуг платформы в течение указанного периода, платформа не несёт денежной ответственности в максимально допустимой законом степени.',
          },
        ],
      },
      {
        heading: '16. СОБЛЮДЕНИЕ ЗАКОНОДАТЕЛЬСТВА',
        blocks: [
          {
            type: 'paragraph',
            text: 'Участник обязан соблюдать применимое законодательство страны своего проживания, страны ведения деятельности и иных юрисдикций, законодательство которых применяется к действиям участника.',
          },
          {
            type: 'paragraph',
            text: 'Участник самостоятельно несёт ответственность за соблюдение требований законодательства.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB не предоставляет юридические, финансовые, инвестиционные, налоговые, бухгалтерские либо иные профессиональные консультации.',
          },
        ],
      },
      {
        heading: '17. ИЗМЕНЕНИЕ ПРАВИЛ',
        blocks: [
          { type: 'paragraph', text: 'KYLYVNYK CLUB вправе периодически изменять настоящие Club Rules.' },
          {
            type: 'paragraph',
            text: 'Обновлённая редакция публикуется на платформе с указанием новой даты вступления в силу либо даты последнего обновления.',
          },
          {
            type: 'paragraph',
            text: 'Продолжение использования платформы после вступления изменений в силу означает согласие участника с обновлённой редакцией Правил в пределах, допускаемых применимым законодательством.',
          },
          {
            type: 'paragraph',
            text: 'Если участник не согласен с изменениями, он обязан прекратить использование платформы.',
          },
        ],
      },
      {
        heading: '18. ПОЛНОТА СОГЛАШЕНИЯ',
        blocks: [
          {
            type: 'paragraph',
            text: 'Настоящие Club Rules являются частью общей юридической документации KYLYVNYK CLUB.',
          },
          {
            type: 'paragraph',
            text: 'Совместно с Terms of Use, Privacy Policy, Cookie Policy, Partner Rules, Business Introduction Rules, Refund Policy, Disclaimer и иными официальными документами платформы настоящие Правила составляют полное соглашение между участником и платформой по вопросам использования платформы.',
          },
          {
            type: 'paragraph',
            text: 'В случае противоречия между настоящими Club Rules и Terms of Use преимущественную силу имеют Terms of Use, если иное прямо не предусмотрено документами платформы.',
          },
        ],
      },
      {
        heading: '19. КОНТАКТНАЯ ИНФОРМАЦИЯ',
        blocks: [
          { type: 'paragraph', text: 'KYLYVNYK CLUB' },
          { type: 'paragraph', text: 'Управляется компанией:' },
          { type: 'paragraph', text: 'Kylyvnyk Consulting LLC' },
          { type: 'paragraph', text: 'Email:' },
          { type: 'paragraph', text: 'kylyvnykclub@gmail.com' },
          { type: 'paragraph', text: 'Почтовый адрес:' },
          { type: 'paragraph', text: '6 Pauline Pl' },
          { type: 'paragraph', text: 'Palm Coast, FL 32164-7535' },
          { type: 'paragraph', text: 'United States' },
          {
            type: 'paragraph',
            text: 'По вопросам, связанным с использованием платформы, участник может обращаться по указанным контактным данным.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB вправе самостоятельно определять порядок, сроки и объём ответов на обращения участников, если иное не предусмотрено обязательными требованиями законодательства.',
          },
        ],
      },
    ],
    note: 'Настоящий документ может переводиться на другие языки исключительно для удобства пользователей. В случае любых расхождений, противоречий либо различий между переводами преимущественную юридическую силу имеет официальная английская версия документа.',
  },
  uk: {
    title: 'Правила клубу',
    effectiveDate: '1 липня 2026 року',
    version: '1.0',
    operatorLines: ['Kylyvnyk Consulting LLC', 'Florida, United States'],
    sections: [
      {
        heading: '1. ЗАГАЛЬНІ ПОЛОЖЕННЯ',
        blocks: [
          {
            type: 'paragraph',
            text: 'Ці Club Rules («Правила клубу») регулюють участь користувачів у KYLYVNYK CLUB, використання функцій платформи, взаємодію з іншими учасниками, використання цифрової клубної картки, участь у заходах платформи, взаємодію з партнерами платформи, участь у системі Business Introductions та використання інших сервісів, що надаються KYLYVNYK CLUB.',
          },
          { type: 'paragraph', text: 'Ці Правила є доповненням до:' },
          {
            type: 'list',
            items: [
              'Terms of Use;',
              'Privacy Policy;',
              'Cookie Policy;',
              'Partner Rules;',
              'Business Introduction Rules;',
              'Refund Policy;',
              'Disclaimer;',
              'інших офіційних документів платформи.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Використання платформи означає повну та безумовну згоду учасника з цими Правилами.',
          },
          {
            type: 'paragraph',
            text: 'Якщо учасник не згоден із цими Правилами, він зобов\'язаний припинити використання платформи.',
          },
          {
            type: 'paragraph',
            text: 'У разі суперечності між цими Правилами та Terms of Use переважну силу мають Terms of Use, якщо інше прямо не передбачено документами платформи.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB має право змінювати, обмежувати, розширювати або припиняти окремі функції платформи, програми участі, категорії членства, сервіси, заходи та інші можливості платформи відповідно до Terms of Use.',
          },
        ],
      },
      {
        heading: '2. ХТО МОЖЕ БУТИ УЧАСНИКОМ',
        blocks: [
          {
            type: 'paragraph',
            text: 'Учасником KYLYVNYK CLUB може стати будь-яка фізична особа, яка відповідає вимогам платформи та приймає умови документів платформи.',
          },
          {
            type: 'paragraph',
            text: 'Використання платформи дозволено лише особам, які досягли 18-річного віку або віку повноліття, встановленого законодавством країни проживання користувача.',
          },
          {
            type: 'paragraph',
            text: 'Платформа має право встановлювати додаткові вимоги для окремих функцій, програм, заходів, категорій участі або окремих територій.',
          },
          {
            type: 'paragraph',
            text: 'Платформа має право запроваджувати процедури перевірки особи, підтвердження контактних даних, підтвердження адреси проживання, підтвердження країни проживання, підтвердження статусу користувача або інші процедури перевірки користувача.',
          },
          {
            type: 'paragraph',
            text: 'Платформа має право відмовити в реєстрації або обмежити доступ до окремих функцій платформи у випадках, допустимих застосовним законодавством.',
          },
          {
            type: 'paragraph',
            text: 'Реєстрація на платформі не створює обов\'язку платформи зберігати доступ користувача до платформи безстроково.',
          },
        ],
      },
      {
        heading: '3. КАТЕГОРІЇ УЧАСТІ',
        blocks: [
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB може надавати різні категорії участі, обсяг прав, привілеїв, обмежень і функцій яких визначається платформою.',
          },
          { type: 'paragraph', text: 'Категорії участі можуть включати:' },
          {
            type: 'list',
            items: [
              'Free Member;',
              'VIP Member;',
              'інші категорії участі, які можуть запроваджуватися платформою в майбутньому.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Платформа має право на власний розсуд створювати нові категорії участі, змінювати наявні категорії, об\'єднувати їх, розділяти, перейменовувати або припиняти окремі програми участі.',
          },
          {
            type: 'paragraph',
            text: 'Жодна категорія участі не надає користувачу права вимагати збереження певного функціоналу, статусу або привілеїв у майбутньому.',
          },
        ],
      },
      {
        heading: '3.1 FREE MEMBER',
        blocks: [
          { type: 'paragraph', text: 'Free Member є базовою категорією участі в KYLYVNYK CLUB.' },
          {
            type: 'paragraph',
            text: 'Учасник цієї категорії може використовувати функції платформи, які на відповідний момент надаються безкоштовно.',
          },
          { type: 'paragraph', text: 'Функціональність Free Member може включати:' },
          {
            type: 'list',
            items: [
              'реєстрацію на платформі;',
              'створення облікового запису;',
              'отримання цифрової клубної картки;',
              'використання основних функцій платформи;',
              'перегляд каталогу партнерів;',
              'перегляд спеціальних умов партнерів;',
              'участь у відкритих заходах платформи;',
              'отримання інформаційних матеріалів платформи;',
              'використання інших безкоштовних функцій, доступних на момент використання платформи.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Платформа має право змінювати, обмежувати, розширювати або припиняти надання окремих безкоштовних функцій у будь-який час.',
          },
        ],
      },
      {
        heading: '3.2 VIP MEMBER',
        blocks: [
          { type: 'paragraph', text: 'VIP Member є розширеною категорією участі.' },
          {
            type: 'paragraph',
            text: 'VIP Membership може надаватися на платній, безкоштовній, акційній, тестовій або іншій основі на розсуд платформи.',
          },
          {
            type: 'paragraph',
            text: 'VIP Member може отримувати доступ до додаткових функцій платформи, включаючи:',
          },
          {
            type: 'list',
            items: [
              'можливість подання заявки на розміщення бізнес-профілю;',
              'можливість участі в системі Business Introductions;',
              'можливість рекомендувати клієнтів іншим учасникам і партнерам платформи;',
              'можливість отримання додаткових інструментів для ділової взаємодії;',
              'доступ до закритих груп;',
              'доступ до закритих чатів;',
              'участь у закритих зустрічах;',
              'участь у ділових заходах;',
              'участь в освітніх заходах;',
              'участь у мережевих заходах (networking events);',
              'доступ до додаткових матеріалів платформи;',
              'доступ до додаткових функцій платформи;',
              'участь у спеціальних програмах платформи;',
              'участь у майбутніх VIP-програмах;',
              'інші функції, що визначаються платформою.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Для доступу до окремих VIP-функцій платформа має право запросити підтвердження особи, контактних даних, країни проживання, адреси проживання, інформації про бізнес або інших відомостей, які платформа обґрунтовано вважає необхідними.',
          },
          {
            type: 'paragraph',
            text: 'Наявність статусу VIP Member не означає автоматичне розміщення бізнес-профілю.',
          },
          {
            type: 'paragraph',
            text: 'Розміщення бізнес-профілю здійснюється виключно після перевірки та схвалення платформою відповідно до Partner Rules, Terms of Use та інших документів платформи.',
          },
          {
            type: 'paragraph',
            text: 'Платформа має право на власний розсуд схвалити, відхилити, приховати, обмежити або видалити бізнес-профіль відповідно до застосовних правил платформи.',
          },
          { type: 'paragraph', text: 'Наявність статусу VIP Member не гарантує:' },
          {
            type: 'list',
            items: [
              'розміщення бізнес-профілю;',
              'збереження бізнес-профілю;',
              'отримання клієнтів;',
              'отримання замовлень;',
              'отримання контрактів;',
              'отримання прибутку;',
              'отримання доходу;',
              'отримання рекомендацій;',
              'отримання Business Introductions;',
              'отримання знижок;',
              'отримання спеціальних умов;',
              'розвиток бізнесу;',
              'досягнення комерційних результатів;',
              'отримання ділових можливостей;',
              'отримання інвестицій;',
              'отримання партнерів;',
              'отримання певної кількості звернень або контактів.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Оплата VIP Membership надає доступ до додаткових функцій платформи, але не є оплатою за клієнтів, рекламу, продажі, ліди, рекомендації, угоди, дохід або гарантований комерційний результат.',
          },
          {
            type: 'paragraph',
            text: 'Склад і обсяг функцій VIP Member можуть змінюватися платформою в будь-який час.',
          },
          {
            type: 'paragraph',
            text: 'Платформа має право запроваджувати додаткові рівні участі, спеціальні програми, розширені статуси, бізнес-статуси, регіональні програми, клубні програми та інші форми участі на власний розсуд.',
          },
        ],
      },
      {
        heading: '4. ПРАВИЛА ПОВЕДІНКИ УЧАСНИКІВ',
        blocks: [
          { type: 'paragraph', text: 'Учасник зобов\'язаний:' },
          {
            type: 'list',
            items: [
              'дотримуватися законодавства;',
              'дотримуватися цих Правил;',
              'поважати інших учасників платформи;',
              'поважати партнерів платформи;',
              'використовувати платформу сумлінно;',
              'дотримуватися правил спілкування та ділової етики;',
              'не створювати перешкод для роботи платформи;',
              'не зловживати функціями платформи;',
              'не використовувати платформу для маніпуляцій, штучного впливу на репутацію учасників або партнерів, публікації фіктивних відгуків або інших недобросовісних практик.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Учасник зобов\'язаний самостійно оцінювати будь-які ділові, комерційні або інші пропозиції, отримані через платформу.',
          },
          {
            type: 'paragraph',
            text: 'Платформа не зобов\'язана контролювати всі дії користувачів і не гарантує достовірність будь-якої інформації, розміщеної учасниками.',
          },
        ],
      },
      {
        heading: '5. ДОСТОВІРНІСТЬ ІНФОРМАЦІЇ',
        blocks: [
          {
            type: 'paragraph',
            text: 'Учасник зобов\'язується надавати достовірну, актуальну та повну інформацію.',
          },
          {
            type: 'paragraph',
            text: 'Учасник зобов\'язаний своєчасно оновлювати свої дані у разі їх зміни.',
          },
          { type: 'paragraph', text: 'Користувач не має права:' },
          {
            type: 'list',
            items: [
              'використовувати неправдиві відомості;',
              'видавати себе за іншу особу;',
              'використовувати чужі дані без дозволу;',
              'створювати фіктивні акаунти;',
              'створювати акаунти від імені організацій без необхідних повноважень.',
            ],
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB має право запросити документи або додаткову інформацію для перевірки особи користувача або підтвердження наданих відомостей.',
          },
          {
            type: 'paragraph',
            text: 'Такі документи можуть включати документи, що посвідчують особу, підтвердження адреси проживання, контактні дані, фотографії, відеопідтвердження особи, документи про реєстрацію бізнесу або інші відомості, які платформа обґрунтовано вважає необхідними.',
          },
          {
            type: 'paragraph',
            text: 'Відмова надати обґрунтовано запитувану інформацію може призвести до обмеження окремих функцій платформи або припинення доступу до платформи.',
          },
          {
            type: 'paragraph',
            text: 'Надання документів або проходження перевірки не означає схвалення, рекомендацію, гарантію або прийняття платформою відповідальності за діяльність користувача.',
          },
        ],
      },
      {
        heading: '6. ОБЛІКОВИЙ ЗАПИС УЧАСНИКА',
        blocks: [
          { type: 'paragraph', text: 'Учасник несе відповідальність за безпеку свого облікового запису.' },
          { type: 'paragraph', text: 'Учасник зобов\'язаний:' },
          {
            type: 'list',
            items: [
              'використовувати надійний пароль;',
              'забезпечувати конфіденційність даних для входу;',
              'своєчасно оновлювати контактну інформацію;',
              'підтримувати актуальність відомостей про країну проживання, адресу проживання та інші дані, якщо такі відомості використовуються платформою;',
              'негайно повідомляти платформу про підозру на несанкціонований доступ.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Учасник несе відповідальність за дії, вчинені через його обліковий запис до моменту повідомлення платформи про можливе компрометування акаунта.',
          },
          {
            type: 'paragraph',
            text: 'Платформа має право тимчасово обмежити доступ до акаунта за наявності ознак порушення безпеки, шахрайства, зловживання функціями платформи або інших обставин, що створюють ризик для платформи, користувачів чи партнерів.',
          },
        ],
      },
      {
        heading: '7. ЦИФРОВА КЛУБНА КАРТКА',
        blocks: [
          { type: 'paragraph', text: 'Платформа може надавати учасникам цифрову клубну картку.' },
          {
            type: 'paragraph',
            text: 'Цифрова клубна картка призначена виключно для ідентифікації учасника в рамках платформи та використання функцій, доступних відповідній категорії участі.',
          },
          { type: 'paragraph', text: 'Клубна картка може містити:' },
          {
            type: 'list',
            items: [
              'ім\'я користувача;',
              'номер картки;',
              'статус учасника;',
              'категорію участі;',
              'термін дії;',
              'інші відомості, що визначаються платформою.',
            ],
          },
          { type: 'paragraph', text: 'Цифрова клубна картка не є:' },
          {
            type: 'list',
            items: [
              'банківською карткою;',
              'кредитною карткою;',
              'дебетовою карткою;',
              'платіжним інструментом;',
              'електронним гаманцем;',
              'інвестиційним продуктом;',
              'фінансовим інструментом.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Наявність клубної картки сама по собі не гарантує отримання знижок, спеціальних умов, послуг, товарів або інших переваг.',
          },
          {
            type: 'paragraph',
            text: 'Учасник зобов\'язаний пред\'являти дійсну клубну картку або іншим способом підтверджувати свій статус учасника у випадках, коли це вимагається для отримання спеціальних умов або доступу до окремих функцій платформи.',
          },
          {
            type: 'paragraph',
            text: 'Платформа має право змінювати зовнішній вигляд, формат, функціональність і механізм використання клубної картки в будь-який час.',
          },
        ],
      },
      {
        heading: '8. ВЗАЄМОДІЯ З ПАРТНЕРАМИ',
        blocks: [
          { type: 'paragraph', text: 'Партнери платформи є незалежними третіми особами.' },
          {
            type: 'paragraph',
            text: 'Учасник самостійно приймає рішення про взаємодію з партнерами платформи.',
          },
          {
            type: 'paragraph',
            text: 'Перед придбанням товарів або послуг учасник зобов\'язаний самостійно оцінити:',
          },
          {
            type: 'list',
            items: [
              'умови пропозиції;',
              'вартість товарів і послуг;',
              'наявність ліцензій і дозволів;',
              'якість товарів і послуг;',
              'репутацію партнера;',
              'інші суттєві обставини.',
            ],
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB не є стороною договорів між учасниками та партнерами.',
          },
          { type: 'paragraph', text: 'Платформа не гарантує:' },
          {
            type: 'list',
            items: [
              'наявність спеціальних умов;',
              'розмір знижок;',
              'якість товарів;',
              'якість послуг;',
              'наявність товарів;',
              'наявність послуг;',
              'виконання зобов\'язань партнерами.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Будь-які угоди між учасником і партнером здійснюються виключно на ризик і відповідальність відповідних сторін.',
          },
          {
            type: 'paragraph',
            text: 'Учасник самостійно несе відповідальність за перевірку застосовності спеціальних умов, термінів дії пропозицій, територіальних обмежень та інших суттєвих умов конкретної пропозиції.',
          },
        ],
      },
      {
        heading: '9. BUSINESS INTRODUCTIONS',
        blocks: [
          {
            type: 'paragraph',
            text: 'Платформа може надавати можливість участі в системі Business Introductions.',
          },
          {
            type: 'paragraph',
            text: 'Business Introductions призначені для сприяння встановленню ділових контактів між учасниками та партнерами платформи.',
          },
          { type: 'paragraph', text: 'Business Introductions можуть включати:' },
          {
            type: 'list',
            items: [
              'обмін контактною інформацією за згодою сторін;',
              'знайомство учасників;',
              'рекомендації ділового характеру;',
              'участь у ділових заходах;',
              'інші форми ділової взаємодії.',
            ],
          },
          { type: 'paragraph', text: 'Business Introductions не є:' },
          {
            type: 'list',
            items: [
              'працевлаштуванням;',
              'агентською діяльністю;',
              'брокерською діяльністю;',
              'інвестиційною діяльністю;',
              'франчайзингом;',
              'MLM-системою;',
              'гарантією отримання клієнтів;',
              'гарантією отримання доходу;',
              'гарантією укладення угод.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Платформа не гарантує будь-які результати участі в системі Business Introductions.',
          },
          {
            type: 'paragraph',
            text: 'Учасники самостійно приймають рішення про вступ у ділові відносини, переговори, укладення угод або здійснення будь-яких комерційних дій після отримання Business Introduction.',
          },
        ],
      },
      {
        heading: '10. СКАРГИ ТА ЗВЕРНЕННЯ',
        blocks: [
          {
            type: 'paragraph',
            text: 'Учасники мають право надсилати платформі скарги, звернення та повідомлення про можливі порушення.',
          },
          { type: 'paragraph', text: 'KYLYVNYK CLUB має право, але не зобов\'язана:' },
          {
            type: 'list',
            items: [
              'розглядати звернення;',
              'запитувати додаткову інформацію;',
              'проводити внутрішні перевірки;',
              'тимчасово обмежувати окремі функції платформи на період перевірки;',
              'тимчасово обмежувати доступ до окремих розділів платформи на період перевірки;',
              'запитувати пояснення в учасників або партнерів;',
              'вживати заходів, передбачених документами платформи.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Платформа не зобов\'язана виступати арбітром, посередником або представником будь-якої сторони спору.',
          },
          {
            type: 'paragraph',
            text: 'Факт розгляду звернення не означає визнання чиєїсь правоти або вини.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB має право приймати рішення на підставі інформації, яку платформа вважає обґрунтовано достатньою в конкретній ситуації.',
          },
          {
            type: 'paragraph',
            text: 'Платформа не зобов\'язана розкривати внутрішні матеріали перевірки, внутрішні процедури прийняття рішень або інформацію, отриману від третіх осіб.',
          },
        ],
      },
      {
        heading: '11. ЗАБОРОНЕНА ДІЯЛЬНІСТЬ',
        blocks: [
          { type: 'paragraph', text: 'Під час використання платформи учаснику забороняється:' },
          {
            type: 'list',
            items: [
              'порушувати законодавство;',
              'використовувати платформу в шахрайських цілях;',
              'розміщувати неправдиву або таку, що вводить в оману, інформацію;',
              'видавати себе за іншу особу;',
              'використовувати чужі дані без дозволу;',
              'створювати фіктивні акаунти;',
              'використовувати автоматизовані засоби для несанкціонованого доступу до платформи;',
              'поширювати шкідливе програмне забезпечення;',
              'втручатися в роботу платформи;',
              'обходити технічні обмеження платформи;',
              'використовувати платформу для розсилання спаму;',
              'використовувати платформу для масового нав\'язування товарів, послуг, інвестицій або інших комерційних пропозицій без згоди отримувачів;',
              'публікувати незаконний контент;',
              'порушувати права інтелектуальної власності;',
              'використовувати платформу для переслідування, погроз, дискримінації або інших форм недобросовісної поведінки;',
              'зловживати системою Business Introductions;',
              'зловживати спеціальними умовами партнерів;',
              'здійснювати діяльність, здатну завдати шкоди платформі, учасникам або партнерам.',
            ],
          },
        ],
      },
      {
        heading: '12. ЗАХОДИ ВПЛИВУ',
        blocks: [
          {
            type: 'paragraph',
            text: 'У разі порушення цих Правил, Terms of Use або інших документів платформи KYLYVNYK CLUB має право застосовувати один або декілька з наведених нижче заходів:',
          },
          {
            type: 'list',
            items: [
              'попередження;',
              'вимогу усунути порушення;',
              'обмеження окремих функцій платформи;',
              'тимчасове обмеження доступу;',
              'тимчасове обмеження участі в окремих програмах;',
              'тимчасове обмеження використання Business Introductions;',
              'тимчасове обмеження використання спеціальних функцій;',
              'обмеження доступу до окремих категорій участі;',
              'обмеження доступу до окремих заходів, груп або програм платформи;',
              'призупинення статусу учасника;',
              'припинення доступу до окремих розділів платформи;',
              'видалення акаунта;',
              'відмову в повторній реєстрації.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Вибір конкретного заходу здійснюється виключно на розсуд платформи з урахуванням характеру порушення, ступеня ризику та інших обставин конкретної ситуації.',
          },
          {
            type: 'paragraph',
            text: 'Застосування одного заходу не обмежує право платформи застосувати додаткові заходи в майбутньому.',
          },
        ],
      },
      {
        heading: '13. ПРИПИНЕННЯ ДОСТУПУ',
        blocks: [
          { type: 'paragraph', text: 'Учасник має право припинити використання платформи в будь-який час.' },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB має право обмежити, призупинити або припинити доступ користувача повністю або частково у випадках:',
          },
          {
            type: 'list',
            items: [
              'порушення документів платформи;',
              'порушення законодавства;',
              'надання недостовірної інформації;',
              'відмови пройти перевірку особи або іншу перевірку, передбачену документами платформи;',
              'скарг користувачів або партнерів;',
              'створення юридичних, фінансових, операційних або репутаційних ризиків для платформи;',
              'зловживання функціями платформи;',
              'інших обставин, які платформа обґрунтовано вважає достатніми для обмеження доступу.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Рішення платформи про обмеження або припинення доступу може прийматися як на визначений строк, так і безстроково залежно від обставин конкретного випадку.',
          },
          {
            type: 'paragraph',
            text: 'Припинення доступу не створює обов\'язку платформи здійснювати повернення раніше сплачених платежів, крім випадків, прямо передбачених застосовним законодавством.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB має право зберігати архівні записи, історію взаємодій, документи перевірки та іншу інформацію в обсязі, необхідному для дотримання законодавства, запобігання шахрайству, вирішення спорів і захисту законних інтересів платформи.',
          },
        ],
      },
      {
        heading: '14. ВІДСУТНІСТЬ ГАРАНТІЙ',
        blocks: [
          { type: 'paragraph', text: 'Платформа надається за принципом «AS IS» та «AS AVAILABLE».' },
          { type: 'paragraph', text: 'KYLYVNYK CLUB не гарантує:' },
          {
            type: 'list',
            items: [
              'отримання знижок;',
              'отримання спеціальних умов;',
              'отримання клієнтів;',
              'отримання доходу;',
              'отримання прибутку;',
              'отримання замовлень;',
              'отримання контрактів;',
              'отримання Business Introductions;',
              'розвиток бізнесу;',
              'досягнення комерційних результатів;',
              'збереження будь-яких функцій платформи;',
              'постійну доступність платформи;',
              'відсутність помилок або технічних збоїв;',
              'сумісність платформи з будь-якими пристроями, програмним забезпеченням або сторонніми сервісами;',
              'збереження даних у разі обставин, що перебувають поза розумним контролем платформи.',
            ],
          },
          { type: 'paragraph', text: 'Використання платформи здійснюється учасником на власний ризик.' },
        ],
      },
      {
        heading: '15. ОБМЕЖЕННЯ ВІДПОВІДАЛЬНОСТІ',
        blocks: [
          {
            type: 'paragraph',
            text: 'У максимально допустимому законом обсязі KYLYVNYK CLUB, Kylyvnyk Consulting LLC, її власники, співробітники, підрядники, представники та афілійовані особи не несуть відповідальності за:',
          },
          {
            type: 'list',
            items: [
              'дії або бездіяльність учасників;',
              'дії або бездіяльність партнерів;',
              'угоди між учасниками та партнерами;',
              'втрату прибутку;',
              'втрату клієнтів;',
              'втрату даних;',
              'втрату ділової репутації;',
              'упущену вигоду;',
              'непрямі збитки;',
              'спеціальні збитки;',
              'штрафні збитки;',
              'випадкові збитки;',
              'втрату ділових можливостей;',
              'втрату потенційних клієнтів;',
              'наслідки рішень, прийнятих учасником на підставі інформації, отриманої через платформу.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Максимальна сукупна відповідальність платформи перед учасником обмежується сумою, фактично сплаченою учасником платформі за останні три (3) календарні місяці, що безпосередньо передують виникненню відповідної вимоги.',
          },
          {
            type: 'paragraph',
            text: 'Якщо учасник не здійснював оплату послуг платформи протягом зазначеного періоду, платформа не несе грошової відповідальності в максимально допустимому законом обсязі.',
          },
        ],
      },
      {
        heading: '16. ДОТРИМАННЯ ЗАКОНОДАВСТВА',
        blocks: [
          {
            type: 'paragraph',
            text: 'Учасник зобов\'язаний дотримуватися застосовного законодавства країни свого проживання, країни здійснення діяльності та інших юрисдикцій, законодавство яких застосовується до дій учасника.',
          },
          {
            type: 'paragraph',
            text: 'Учасник самостійно несе відповідальність за дотримання вимог законодавства.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB не надає юридичні, фінансові, інвестиційні, податкові, бухгалтерські або інші професійні консультації.',
          },
        ],
      },
      {
        heading: '17. ЗМІНА ПРАВИЛ',
        blocks: [
          { type: 'paragraph', text: 'KYLYVNYK CLUB має право періодично змінювати ці Club Rules.' },
          {
            type: 'paragraph',
            text: 'Оновлена редакція публікується на платформі із зазначенням нової дати набрання чинності або дати останнього оновлення.',
          },
          {
            type: 'paragraph',
            text: 'Продовження використання платформи після набрання змінами чинності означає згоду учасника з оновленою редакцією Правил у межах, допустимих застосовним законодавством.',
          },
          {
            type: 'paragraph',
            text: 'Якщо учасник не згоден зі змінами, він зобов\'язаний припинити використання платформи.',
          },
        ],
      },
      {
        heading: '18. ПОВНОТА УГОДИ',
        blocks: [
          {
            type: 'paragraph',
            text: 'Ці Club Rules є частиною загальної юридичної документації KYLYVNYK CLUB.',
          },
          {
            type: 'paragraph',
            text: 'Разом із Terms of Use, Privacy Policy, Cookie Policy, Partner Rules, Business Introduction Rules, Refund Policy, Disclaimer та іншими офіційними документами платформи ці Правила становлять повну угоду між учасником і платформою щодо використання платформи.',
          },
          {
            type: 'paragraph',
            text: 'У разі суперечності між цими Club Rules та Terms of Use переважну силу мають Terms of Use, якщо інше прямо не передбачено документами платформи.',
          },
        ],
      },
      {
        heading: '19. КОНТАКТНА ІНФОРМАЦІЯ',
        blocks: [
          { type: 'paragraph', text: 'KYLYVNYK CLUB' },
          { type: 'paragraph', text: 'Керується компанією:' },
          { type: 'paragraph', text: 'Kylyvnyk Consulting LLC' },
          { type: 'paragraph', text: 'Email:' },
          { type: 'paragraph', text: 'kylyvnykclub@gmail.com' },
          { type: 'paragraph', text: 'Поштова адреса:' },
          { type: 'paragraph', text: '6 Pauline Pl' },
          { type: 'paragraph', text: 'Palm Coast, FL 32164-7535' },
          { type: 'paragraph', text: 'United States' },
          {
            type: 'paragraph',
            text: 'З питань, пов\'язаних із використанням платформи, учасник може звертатися за вказаними контактними даними.',
          },
          {
            type: 'paragraph',
            text: 'KYLYVNYK CLUB має право самостійно визначати порядок, строки та обсяг відповідей на звернення учасників, якщо інше не передбачено обов\'язковими вимогами законодавства.',
          },
        ],
      },
    ],
    note: 'Цей документ може перекладатися на інші мови виключно для зручності користувачів. У разі будь-яких розбіжностей, суперечностей чи відмінностей між перекладами переважну юридичну силу має офіційна англомовна версія документа.',
  },
};
