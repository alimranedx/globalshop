<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number', 50)->unique();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->unsignedBigInteger('customer_id')->nullable()->index();
            $table->enum('user_type', ['customer', 'shop_owner', 'shop_employee', 'guest'])->default('guest');
            $table->unsignedBigInteger('shop_id')->nullable()->index();
            $table->string('name');
            $table->string('email');
            $table->string('phone', 50)->nullable();
            $table->enum('category', [
                'login_problem',
                'password_reset',
                'account_locked',
                'account_suspended',
                'email_change',
                'shop_access_problem',
                'employee_access_problem',
                'permission_problem',
                'other'
            ])->default('other');
            $table->string('subject');
            $table->text('message');
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->enum('status', [
                'open',
                'in_progress',
                'waiting_for_customer',
                'resolved',
                'closed'
            ])->default('open');
            $table->unsignedBigInteger('assigned_admin_id')->nullable()->index();
            $table->text('device_info')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('customer_id')->references('id')->on('marketplace_customers')->onDelete('cascade');
            $table->foreign('shop_id')->references('id')->on('shops')->onDelete('set null');
            $table->foreign('assigned_admin_id')->references('id')->on('users')->onDelete('set null');

            $table->index('status');
            $table->index('priority');
            $table->index('category');
            $table->index('created_at');
        });

        Schema::create('support_ticket_messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ticket_id')->index();
            $table->enum('sender_type', ['customer', 'shop_owner', 'shop_employee', 'admin', 'system'])->default('customer');
            $table->unsignedBigInteger('sender_id')->nullable();
            $table->text('message');
            $table->enum('message_type', ['public_reply', 'internal_note'])->default('public_reply');
            $table->timestamps();

            $table->foreign('ticket_id')->references('id')->on('support_tickets')->onDelete('cascade');
            $table->index('message_type');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('support_ticket_messages');
        Schema::dropIfExists('support_tickets');
    }
};
