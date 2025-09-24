import logging
from typing import Any

from domains.lenses.models import (
    ChartContext,
    CompatibilityRule,
    DatasetContext,
    EvaluationContext,
)


class RuleEvaluator:
    """Lens rule evaluation engine."""

    def __init__(self, context: EvaluationContext):
        self.context = context.model_dump()

    def _resolve_fact(self, fact_string: str) -> Any:
        """Resolves the dot-notation fact string against the context.

        Ex. "chart.type" -> self.context['chart']['type']
        """
        current_value = self.context
        keys = fact_string.split(".")

        for key in keys:
            if not isinstance(current_value, dict):
                logging.warning(
                    f"Cannot resolve key '{key}' in non-dictionary: {current_value}"
                )
                return None

            current_value = current_value.get(key)  # type: ignore
            if current_value is None:
                return None

            return current_value

    def evaluate(self, rule: CompatibilityRule) -> bool:
        """Evaluates a single rule and returns True if it passes, False otherwise."""
        fact_value = self._resolve_fact(rule.fact)
        if fact_value is None and not rule.operator.startswith("count"):
            return False

        match rule.operator:
            case "in":
                return fact_value in rule.value
            case "not_in":
                return fact_value not in rule.value
            case "equal_to":
                return fact_value == rule.value
            case "greater_than_or_equal_to":
                return fact_value >= rule.value
            case "count_where":
                if not isinstance(fact_value, list):
                    return False

                count = sum(
                    1
                    for item in fact_value
                    if all(item.get(k) == v for k, v in rule.params.items())
                )

                if rule.expected:
                    temp_evaluator = RuleEvaluator(
                        EvaluationContext(
                            chart=ChartContext(type="", active_columns=[]),
                            dataset=DatasetContext(
                                columns=[], column_counts_by_dtype={}
                            ),
                        )
                    )
                    temp_evaluator.context = {"count": count}
                    nested_rule = rule.expected.model_copy(update={"fact": "count"})
                    return temp_evaluator.evaluate(nested_rule)
                logging.warning(
                    f"Operator 'count_where' for fact '{rule.fact}' is missing 'expected' block."
                )
                return False
            case "filter_where":
                if not isinstance(fact_value, list):
                    return False

                filtered_list = [
                    item
                    for item in fact_value
                    if isinstance(item, dict)
                    and all(item.get(k) == v for k, v in rule.params.items())
                ]

                if rule.expected:
                    count = len(filtered_list)
                    temp_evaluator = RuleEvaluator(
                        EvaluationContext(
                            chart=ChartContext(type="", active_columns=[]),
                            dataset=DatasetContext(
                                columns=[], column_counts_by_dtype={}
                            ),
                        )
                    )
                    temp_evaluator.context = {"result": count}
                    nested_rule = rule.expected.model_copy(update={"fact": "result"})
                    return temp_evaluator.evaluate(nested_rule)
                logging.warning(
                    f"Operator 'filter_where' for fact '{rule.fact}' is missing 'expected' block"
                )
                return False

            case _:
                logging.warning(f"Unsupported operator: {rule.operator}")
                return False
