import { jsxs as _jsxs } from "react/jsx-runtime";
export function AuditReportHeading({ level, number, children }) {
    const Heading = `h${level}`;
    return _jsxs(Heading, { children: [number && number + ' ', children] });
}
