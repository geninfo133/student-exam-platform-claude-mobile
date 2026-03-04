/**
 * Exam category options filtered by the school's board type.
 * board comes from user.board (set at registration).
 */

const CBSE_CATEGORIES = [
  { value: 'pre_mid', label: 'Pre-Mid Term' },
  { value: 'mid',     label: 'Mid Term' },
  { value: 'post_mid',label: 'Post-Mid Term' },
  { value: 'annual',  label: 'Annual' },
  { value: 'pat1',    label: 'PAT 1' },
  { value: 'pat2',    label: 'PAT 2' },
  { value: 'pat3',    label: 'PAT 3' },
  { value: 'pat4',    label: 'PAT 4' },
];

const STATE_CATEGORIES = [
  { value: 'unit1',       label: 'Unit Test 1' },
  { value: 'unit2',       label: 'Unit Test 2' },
  { value: 'quarterly',   label: 'Quarterly' },
  { value: 'half_yearly', label: 'Half Yearly' },
  { value: 'pre_final',   label: 'Pre-Final' },
  { value: 'final',       label: 'Final' },
];

const ICSE_INTL_CATEGORIES = [
  { value: 'pre_mid',  label: 'Pre-Mid Term' },
  { value: 'mid',      label: 'Mid Term' },
  { value: 'post_mid', label: 'Post-Mid Term' },
  { value: 'annual',   label: 'Annual' },
];

/**
 * Returns the list of category options for a given board code.
 * @param {string} board  e.g. 'CBSE', 'STATE', 'ICSE', 'INTL', 'NEET', …
 * @returns {{ value: string, label: string }[]}
 */
export function getCategoriesForBoard(board) {
  switch (board) {
    case 'CBSE':
      return CBSE_CATEGORIES;
    case 'STATE':
      return STATE_CATEGORIES;
    case 'ICSE':
    case 'INTL':
      return ICSE_INTL_CATEGORIES;
    default:
      // Coaching boards (BANK, EAMCET, NEET, JEE, DSC, OTHER) don't have
      // fixed term exam categories, so return empty.
      return [];
  }
}

/**
 * Returns a display label for a given category value.
 */
export const CATEGORY_LABELS = {
  pre_mid:    'Pre-Mid',
  mid:        'Mid Term',
  post_mid:   'Post-Mid',
  annual:     'Annual',
  pat1:       'PAT 1',
  pat2:       'PAT 2',
  pat3:       'PAT 3',
  pat4:       'PAT 4',
  unit1:      'Unit Test 1',
  unit2:      'Unit Test 2',
  quarterly:  'Quarterly',
  half_yearly:'Half Yearly',
  pre_final:  'Pre-Final',
  final:      'Final',
};

/**
 * The fixed display order for columns in the progress card.
 */
export const CATEGORY_ORDER = [
  'pre_mid', 'mid', 'post_mid', 'annual',
  'pat1', 'pat2', 'pat3', 'pat4',
  'unit1', 'unit2', 'quarterly', 'half_yearly', 'pre_final', 'final',
];
