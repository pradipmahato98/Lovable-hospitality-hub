import { ServiceBootstrap } from "../shared/ServiceBootstrap";

export function BudgetSetupService() {
  return (
    <ServiceBootstrap
      title="Budget Setup Service"
      category="Setup"
      description="Manage budget templates, allocation rules, and approval workflows."
    />
  );
}
