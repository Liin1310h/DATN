using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpenseTrackerAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpdateLoanSchedule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Loans_LoanId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Accounts_UserId",
                table: "Accounts");

            migrationBuilder.RenameColumn(
                name: "RemainingBalance",
                table: "RepaymentSchedules",
                newName: "PenaltyAmount");

            migrationBuilder.RenameColumn(
                name: "RemainingAmount",
                table: "Loans",
                newName: "RemainingPrincipalAmount");

            migrationBuilder.RenameColumn(
                name: "IsCompleted",
                table: "Loans",
                newName: "IsInterestAccruedDaily");

            migrationBuilder.RenameColumn(
                name: "InterestCalculationType",
                table: "Loans",
                newName: "Status");

            migrationBuilder.AddColumn<decimal>(
                name: "ClosingPrincipalBalance",
                table: "RepaymentSchedules",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "FeeAmount",
                table: "RepaymentSchedules",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "InterestDays",
                table: "RepaymentSchedules",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "OpeningPrincipalBalance",
                table: "RepaymentSchedules",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PaidFeeAmount",
                table: "RepaymentSchedules",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PaidPenaltyAmount",
                table: "RepaymentSchedules",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "PeriodEndDate",
                table: "RepaymentSchedules",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "PeriodStartDate",
                table: "RepaymentSchedules",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "RepaymentSchedules",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<decimal>(
                name: "InterestRate",
                table: "Loans",
                type: "numeric(9,4)",
                precision: 9,
                scale: 4,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(5,2)");

            migrationBuilder.AlterColumn<DateTime>(
                name: "DueDate",
                table: "Loans",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Currency",
                table: "Loans",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<int>(
                name: "AllocationStrategy",
                table: "Loans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CounterPartyType",
                table: "Loans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "LateFeeRate",
                table: "Loans",
                type: "numeric(9,4)",
                precision: 9,
                scale: 4,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PaymentDayOfMonth",
                table: "Loans",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PrepaymentFeeRate",
                table: "Loans",
                type: "numeric(9,4)",
                precision: 9,
                scale: 4,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PrepaymentPolicy",
                table: "Loans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RepaymentMethod",
                table: "Loans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_UserId_Name",
                table: "Accounts",
                columns: new[] { "UserId", "Name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Loans_LoanId",
                table: "Transactions",
                column: "LoanId",
                principalTable: "Loans",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Loans_LoanId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Accounts_UserId_Name",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "ClosingPrincipalBalance",
                table: "RepaymentSchedules");

            migrationBuilder.DropColumn(
                name: "FeeAmount",
                table: "RepaymentSchedules");

            migrationBuilder.DropColumn(
                name: "InterestDays",
                table: "RepaymentSchedules");

            migrationBuilder.DropColumn(
                name: "OpeningPrincipalBalance",
                table: "RepaymentSchedules");

            migrationBuilder.DropColumn(
                name: "PaidFeeAmount",
                table: "RepaymentSchedules");

            migrationBuilder.DropColumn(
                name: "PaidPenaltyAmount",
                table: "RepaymentSchedules");

            migrationBuilder.DropColumn(
                name: "PeriodEndDate",
                table: "RepaymentSchedules");

            migrationBuilder.DropColumn(
                name: "PeriodStartDate",
                table: "RepaymentSchedules");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "RepaymentSchedules");

            migrationBuilder.DropColumn(
                name: "AllocationStrategy",
                table: "Loans");

            migrationBuilder.DropColumn(
                name: "CounterPartyType",
                table: "Loans");

            migrationBuilder.DropColumn(
                name: "LateFeeRate",
                table: "Loans");

            migrationBuilder.DropColumn(
                name: "PaymentDayOfMonth",
                table: "Loans");

            migrationBuilder.DropColumn(
                name: "PrepaymentFeeRate",
                table: "Loans");

            migrationBuilder.DropColumn(
                name: "PrepaymentPolicy",
                table: "Loans");

            migrationBuilder.DropColumn(
                name: "RepaymentMethod",
                table: "Loans");

            migrationBuilder.RenameColumn(
                name: "PenaltyAmount",
                table: "RepaymentSchedules",
                newName: "RemainingBalance");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "Loans",
                newName: "InterestCalculationType");

            migrationBuilder.RenameColumn(
                name: "RemainingPrincipalAmount",
                table: "Loans",
                newName: "RemainingAmount");

            migrationBuilder.RenameColumn(
                name: "IsInterestAccruedDaily",
                table: "Loans",
                newName: "IsCompleted");

            migrationBuilder.AlterColumn<decimal>(
                name: "InterestRate",
                table: "Loans",
                type: "numeric(5,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(9,4)",
                oldPrecision: 9,
                oldScale: 4);

            migrationBuilder.AlterColumn<DateTime>(
                name: "DueDate",
                table: "Loans",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<string>(
                name: "Currency",
                table: "Loans",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(10)",
                oldMaxLength: 10);

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_UserId",
                table: "Accounts",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Loans_LoanId",
                table: "Transactions",
                column: "LoanId",
                principalTable: "Loans",
                principalColumn: "Id");
        }
    }
}
