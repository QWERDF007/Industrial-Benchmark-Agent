ELIGIBLE_PAIR_SQL = "(relation='EXACT' OR (mode IN ('combined','visual') AND relation IN ('NEAR_CANDIDATE','VISUAL_REFERENCE')))"
REVIEW_PAIR_SQL = "(json_array_length(difference_types)>0 OR relation!='EXACT' OR annotation_issues)"
