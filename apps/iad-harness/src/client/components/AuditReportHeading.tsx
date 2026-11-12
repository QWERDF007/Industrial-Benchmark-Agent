import React from 'react';

export interface AuditReportHeadingSpec {
  level: 2|3|4|5|6;
  number?: string;
}

export function AuditReportHeading({level,number,children}:AuditReportHeadingSpec&{children:React.ReactNode}) {
  const Heading=`h${level}` as 'h2'|'h3'|'h4'|'h5'|'h6';
  return <Heading>{number&&number+' '}{children}</Heading>;
}
