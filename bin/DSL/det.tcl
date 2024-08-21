puts "DSL Exerciser sample configuration"
puts "(C) Verety Softwares - All Rights Reserved\n"
namespace eval NewPOS::DSL::Config {
    set Verbose TRUE
    set Path "..\\sample\\dsl.xml"
    namespace eval Messaging {
	set LocalPort 20007
	set RemotePort 20008
	set RemoteService "DSLServer"; # Cannot contain spaces
	set LocalService "DSLClient";  # Cannot contain spaces
    }
    namespace eval Drivers {
	namespace eval MagneticStripe {
	    set LogicalName "magst00"
	    set AsynchMode FALSE
	}
	namespace eval CustomerDisplay {
	    set LogicalName "linedisp00"
	}
	namespace eval CashDrawer {
	    set LogicalName "cashdrawer00"
	}
    }
}
puts "Configuration Summary:"
puts "NewPOS::DSL::Config:"
puts "\tVerbose: $NewPOS::DSL::Config::Verbose"
puts "\tPath...: $NewPOS::DSL::Config::Path"
puts "NewPOS::DSL::Config::Messaging:"
puts "\tLocalPort....: $NewPOS::DSL::Config::Messaging::LocalPort"
puts "\tRemotePort...: $NewPOS::DSL::Config::Messaging::RemotePort"
puts "\tRemoteService: $NewPOS::DSL::Config::Messaging::RemoteService"
puts "\tLocalService.: $NewPOS::DSL::Config::Messaging::LocalService"
puts "NewPOS::DSL::Config::Drivers:"
puts "\tMagneticStripe::LogicalName.: $NewPOS::DSL::Config::Drivers::MagneticStripe::LogicalName"
puts "\tMagneticStripe::AsynchMode..: $NewPOS::DSL::Config::Drivers::MagneticStripe::AsynchMode"
puts "\tCustomerDisplay::LogicalName: $NewPOS::DSL::Config::Drivers::CustomerDisplay::LogicalName"
puts "\tCashDrawer::LogicalName.....: $NewPOS::DSL::Config::Drivers::CashDrawer::LogicalName"
puts "\n\n"