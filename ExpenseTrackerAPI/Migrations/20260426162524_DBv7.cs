using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpenseTrackerAPI.Migrations
{
    /// <inheritdoc />
    public partial class DBv7 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsRecurringReminder",
                table: "Loans",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "NextReminderDate",
                table: "Loans",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReminderBeforeDays",
                table: "Loans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ReminderFrequency",
                table: "Loans",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Icon", "Name" },
                values: new object[] { "Gamepad2", "Giải trí" });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "Icon", "Name" },
                values: new object[] { "Receipt", "Hoá đơn" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsRecurringReminder",
                table: "Loans");

            migrationBuilder.DropColumn(
                name: "NextReminderDate",
                table: "Loans");

            migrationBuilder.DropColumn(
                name: "ReminderBeforeDays",
                table: "Loans");

            migrationBuilder.DropColumn(
                name: "ReminderFrequency",
                table: "Loans");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Icon", "Name" },
                values: new object[] { "Banknote", "Lương" });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "Icon", "Name" },
                values: new object[] { "Landmark", "Vay nợ" });
        }
    }
}
