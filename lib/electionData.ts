import { ElectionGroup } from './types';

// Election configuration - Arabic candidates data
export const ELECTION_CONFIG: ElectionGroup[] = [
  {
    id: 'head',
    name: 'رئيس مجلس الإدارة',
    winnersCount: 1,
    candidates: [
      { id: 'head-1', name: 'ناجح البارودى', photo: '/images/xxx.png', votes: 0, number: 1 },
      { id: 'head-2', name: 'يحيي العمدة', photo: '/images/يحيي العمدة.png', votes: 0, number: 2 },
    ],
  },
  {
    id: 'head-assistant',
    name: 'نائب رئيس مجلس الإدارة',
    winnersCount: 1,
    candidates: [
      { id: 'assistant-1', name: 'بهجت فراج', photo: '/images/بهجت فراج.png', votes: 0, number: 1 },
      { id: 'assistant-2', name: 'خالد ذو الفقار مراد', photo: '/images/خالد ذو الفقار مراد.png', votes: 0, number: 2 },
    ],
  },
  {
    id: 'finance',
    name: 'أمين الصندوق',
    winnersCount: 1,
    candidates: [
      { id: 'finance-1', name: 'احمد طه', photo: '/images/احمد طه.png', votes: 0, number: 1 },
      { id: 'finance-2', name: 'عمرو الخازندار', photo: '/images/عمرو الخازندار.png', votes: 0, number: 2 },
    ],
  },
  {
    id: 'members',
    name: 'عضو مجلس الإدارة',
    winnersCount: 5,
    candidates: [
      { id: 'member-1', name: 'ابوعلى حامد المليجي', photo: '/images/ابوعلى حامد المليجي.png', votes: 0, number: 1 },
      { id: 'member-2', name: 'كابتن: احمد حمدي', photo: '/images/كابتناحمد حمدي.png', votes: 0, number: 2 },
      { id: 'member-3', name: 'احمد محي الدين على', photo: '/images/احمد محي الدين على.png', votes: 0, number: 3 },
      { id: 'member-4', name: 'اسامة اسماعيل', photo: '/images/xxx.png', votes: 0, number: 4 },
      { id: 'member-5', name: 'اشرف حموده', photo: '/images/xxx.png', votes: 0, number: 5 },
      { id: 'member-6', name: 'اشرف رفعت السيد', photo: '/images/اشرف رفعت السيد.png', votes: 0, number: 6 },
      { id: 'member-7', name: 'جلال قمر', photo: '/images/xxx.png', votes: 0, number: 7 },
      { id: 'member-8', name: 'ريهام عبدالفتاح غلاب السليني', photo: '/images/ريهام عبدالفتاح غلاب السليني.png', votes: 0, number: 8 },
      { id: 'member-9', name: 'صلاح معروف المأذون', photo: '/images/xxx.png', votes: 0, number: 9 },
      { id: 'member-10', name: 'محمد طنطاوى', photo: '/images/xxx.png', votes: 0, number: 10 },
      { id: 'member-11', name: 'محمد الصابونجي', photo: '/images/محمد الصابونجي.png', votes: 0, number: 11 },
      { id: 'member-12', name: 'محمد على', photo: '/images/محمد على.png', votes: 0, number: 12 },
      { id: 'member-13', name: 'كابتن زبزو', photo: '/images/كابتن زبزو.png', votes: 0, number: 13 },
      { id: 'member-14', name: 'هيثم عبدالسلام', photo: '/images/هيثم عبدالسلام.png', votes: 0, number: 14 },
      { id: 'member-15', name: 'وائل خضراوي أبو رحمه', photo: '/images/xxx.png', votes: 0, number: 15 },
      { id: 'member-16', name: 'وائل مهني', photo: '/images/وائل مهني⚖️.png', votes: 0, number: 16 },
    ],
  },
  {
    id: 'under-age',
    name: 'عضو مجلس الإدارة (تحت السن)',
    winnersCount: 2,
    candidates: [
      { id: 'underage-1', name: 'احمد عبدالكريم المحامي', photo: '/images/احمد عبدالكريم المحامي.png', votes: 0, number: 1 },
      { id: 'underage-2', name: 'كريم عصام عبدالوهاب', photo: '/images/كريم عصام عبدالوهاب.png', votes: 0, number: 2 },
      { id: 'underage-3', name: 'محمد عماد الدين', photo: '/images/xxx.png', votes: 0, number: 3 },
      { id: 'underage-4', name: 'محمود جمال عبدالرؤوف', photo: '/images/محمود جمال عبدالرؤوف.png', votes: 0, number: 4 },
      { id: 'underage-5', name: 'مصطفي سليم', photo: '/images/مصطفي سليم.png', votes: 0, number: 5 },
    ],
  },
];

// Passwords - update these during setup
export const VOTE_ENTRY_PASSWORD = 'vote123'; // Change this
export const RESULTS_VIEW_PASSWORD = 'results123'; // Change this
export const TOP_VOTE_PASSWORD = 'top5550'; // Password for top positions voting page
export const OTHER_VOTE_PASSWORD = 'other5550'; // Password for members and under-age voting page

