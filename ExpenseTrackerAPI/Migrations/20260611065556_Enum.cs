using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpenseTrackerAPI.Migrations
{
    /// <inheritdoc />
    public partial class Enum : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "Transactions"
                ALTER COLUMN "Type" DROP DEFAULT;

                ALTER TABLE "Transactions"
                ALTER COLUMN "Type" TYPE integer
                USING CASE lower("Type"::text)
                    WHEN 'expense' THEN 1
                    WHEN 'income' THEN 2
                    WHEN 'transfer' THEN 3
                    WHEN 'borrow' THEN 4
                    WHEN 'lend' THEN 5

                    WHEN 'chi' THEN 1
                    WHEN 'thu' THEN 2
                    WHEN 'chuyen_khoan' THEN 3
                    WHEN 'vay' THEN 4
                    WHEN 'cho_vay' THEN 5

                    WHEN '10' THEN 4
                    WHEN '11' THEN 5

                    ELSE
                        CASE
                            WHEN "Type"::text ~ '^[0-9]+$' THEN "Type"::integer
                            ELSE 1
                        END
                END;

                ALTER TABLE "Transactions"
                ALTER COLUMN "Type" SET DEFAULT 1;
            """);

            migrationBuilder.Sql("""
                ALTER TABLE "PersonalCategoryRules"
                ALTER COLUMN "Type" DROP DEFAULT;

                ALTER TABLE "PersonalCategoryRules"
                ALTER COLUMN "Type" TYPE integer
                USING CASE lower("Type"::text)
                    WHEN 'expense' THEN 1
                    WHEN 'income' THEN 2
                    WHEN 'transfer' THEN 3
                    WHEN 'borrow' THEN 4
                    WHEN 'lend' THEN 5

                    WHEN 'chi' THEN 1
                    WHEN 'thu' THEN 2
                    WHEN 'chuyen_khoan' THEN 3
                    WHEN 'vay' THEN 4
                    WHEN 'cho_vay' THEN 5

                    WHEN '10' THEN 4
                    WHEN '11' THEN 5

                    ELSE
                        CASE
                            WHEN "Type"::text ~ '^[0-9]+$' THEN "Type"::integer
                            ELSE 1
                        END
                END;

                ALTER TABLE "PersonalCategoryRules"
                ALTER COLUMN "Type" SET DEFAULT 1;
            """);

            migrationBuilder.Sql("""
                ALTER TABLE "Loans"
                ALTER COLUMN "ReminderFrequency" DROP DEFAULT;

                ALTER TABLE "Loans"
                ALTER COLUMN "ReminderFrequency" TYPE integer
                USING CASE lower("ReminderFrequency"::text)
                    WHEN 'daily' THEN 0
                    WHEN 'weekly' THEN 1
                    WHEN 'monthly' THEN 2

                    WHEN 'day' THEN 0
                    WHEN 'week' THEN 1
                    WHEN 'month' THEN 2

                    ELSE
                        CASE
                            WHEN "ReminderFrequency"::text ~ '^[0-9]+$' THEN "ReminderFrequency"::integer
                            ELSE 2
                        END
                END;

                ALTER TABLE "Loans"
                ALTER COLUMN "ReminderFrequency" SET DEFAULT 2;
            """);

            migrationBuilder.Sql("""
                ALTER TABLE "Loans"
                ALTER COLUMN "InterestUnit" DROP DEFAULT;

                ALTER TABLE "Loans"
                ALTER COLUMN "InterestUnit" TYPE integer
                USING CASE lower("InterestUnit"::text)
                    WHEN 'percent_per_month' THEN 1
                    WHEN 'percent_per_year' THEN 2
                    WHEN 'percentpermonth' THEN 1
                    WHEN 'percentperyear' THEN 2
                    WHEN 'month' THEN 1
                    WHEN 'year' THEN 2

                    ELSE
                        CASE
                            WHEN "InterestUnit"::text ~ '^[0-9]+$' THEN "InterestUnit"::integer
                            ELSE 1
                        END
                END;

                ALTER TABLE "Loans"
                ALTER COLUMN "InterestUnit" SET DEFAULT 1;
            """);

            migrationBuilder.AddColumn<int>(
                name: "Duration",
                table: "Loans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DurationUnit",
                table: "Loans",
                type: "integer",
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Duration",
                table: "Loans");

            migrationBuilder.DropColumn(
                name: "DurationUnit",
                table: "Loans");

            migrationBuilder.Sql("""
                ALTER TABLE "Transactions"
                ALTER COLUMN "Type" DROP DEFAULT;

                ALTER TABLE "Transactions"
                ALTER COLUMN "Type" TYPE character varying(20)
                USING CASE "Type"
                    WHEN 1 THEN 'expense'
                    WHEN 2 THEN 'income'
                    WHEN 3 THEN 'transfer'
                    WHEN 4 THEN 'borrow'
                    WHEN 5 THEN 'lend'
                    ELSE 'expense'
                END;

                ALTER TABLE "Transactions"
                ALTER COLUMN "Type" SET DEFAULT 'expense';
            """);

            migrationBuilder.Sql("""
                ALTER TABLE "PersonalCategoryRules"
                ALTER COLUMN "Type" DROP DEFAULT;

                ALTER TABLE "PersonalCategoryRules"
                ALTER COLUMN "Type" TYPE character varying(20)
                USING CASE "Type"
                    WHEN 1 THEN 'expense'
                    WHEN 2 THEN 'income'
                    WHEN 3 THEN 'transfer'
                    WHEN 4 THEN 'borrow'
                    WHEN 5 THEN 'lend'
                    ELSE 'expense'
                END;

                ALTER TABLE "PersonalCategoryRules"
                ALTER COLUMN "Type" SET DEFAULT 'expense';
            """);

            migrationBuilder.Sql("""
                ALTER TABLE "Loans"
                ALTER COLUMN "ReminderFrequency" DROP DEFAULT;

                ALTER TABLE "Loans"
                ALTER COLUMN "ReminderFrequency" TYPE text
                USING CASE "ReminderFrequency"
                    WHEN 0 THEN 'daily'
                    WHEN 1 THEN 'weekly'
                    WHEN 2 THEN 'monthly'
                    ELSE 'monthly'
                END;

                ALTER TABLE "Loans"
                ALTER COLUMN "ReminderFrequency" SET DEFAULT 'monthly';
            """);

            migrationBuilder.Sql("""
                ALTER TABLE "Loans"
                ALTER COLUMN "InterestUnit" DROP DEFAULT;

                ALTER TABLE "Loans"
                ALTER COLUMN "InterestUnit" TYPE character varying(50)
                USING CASE "InterestUnit"
                    WHEN 1 THEN 'month'
                    WHEN 2 THEN 'year'
                    ELSE 'month'
                END;

                ALTER TABLE "Loans"
                ALTER COLUMN "InterestUnit" SET DEFAULT 'month';
            """);
        }
    }
}