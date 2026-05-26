using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpenseTrackerAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddPaidAmount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "PaidInterestAmount",
                table: "RepaymentSchedules",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PaidPrincipalAmount",
                table: "RepaymentSchedules",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PaidTotalAmount",
                table: "RepaymentSchedules",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaidInterestAmount",
                table: "RepaymentSchedules");

            migrationBuilder.DropColumn(
                name: "PaidPrincipalAmount",
                table: "RepaymentSchedules");

            migrationBuilder.DropColumn(
                name: "PaidTotalAmount",
                table: "RepaymentSchedules");
        }
    }
}
