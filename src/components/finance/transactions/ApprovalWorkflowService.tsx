import { ServiceBootstrap } from "../shared/ServiceBootstrap";

export function ApprovalWorkflowService() {
  return (
    <ServiceBootstrap
      title="Approval Workflow Engine"
      category="Transactions"
      description="Multi-level approvals for journals, vendors, payments, and budgets."
    />
  );
}
