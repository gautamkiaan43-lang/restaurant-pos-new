const serviceRepository = require('./services.repository');

class ServiceController {
  async getAllServices(req, res) {
    try {
      const services = await serviceRepository.getAllServices();
      const mappedServices = services.map(s => ({
        id: s.id,
        name: s.service_name || s.name,
        transport: s.service_type || s.transport,
        category: s.service_type || s.transport,
        price: parseFloat(s.price_per_person || s.price || 0),
        notes: s.description || s.notes,
        description: s.description || s.notes,
        icon: s.service_type?.toLowerCase().includes('shuttle') ? '🚐' : 
              s.service_type?.toLowerCase().includes('tour') ? '🗺️' :
              s.service_type?.toLowerCase().includes('cruise') ? '🚤' :
              s.service_type?.toLowerCase().includes('hike') ? '🥾' : '🧭'
      }));
      res.json({ success: true, data: mappedServices });
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async createService(req, res) {
    try {
      const { name, transport, price, notes } = req.body;
      
      if (!name || !transport || !price) {
        return res.status(400).json({ success: false, message: 'Name, Transport and Price are required' });
      }

      const id = await serviceRepository.createService({
        service_name: name,
        service_type: transport,
        price_per_person: price,
        description: notes
      });

      res.status(201).json({ 
        success: true, 
        data: { id, name, transport, price, notes } 
      });
    } catch (error) {
      console.error('Error creating service:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getAllBookings(req, res) {
    try {
      const bookings = await serviceRepository.getAllBookings();
      const mappedBookings = bookings.map(b => ({
        id: b.id,
        serviceId: b.service_id,
        guestId: b.guest_id,
        serviceName: b.service_name,
        category: b.service_type,
        guestName: b.guest_name,
        guestEmail: b.guest_email,
        guestPhone: b.guest_phone,
        date: b.booking_date,
        time: b.booking_time,
        guests: b.total_guests,
        total: b.total_amount,
        notes: b.notes,
        status: b.booking_status?.charAt(0).toUpperCase() + b.booking_status?.slice(1) || 'Pending'
      }));
      res.json({ success: true, data: mappedBookings });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async updateBookingStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const success = await serviceRepository.updateBookingStatus(id, status.toLowerCase());
      if (success) {
        res.json({ success: true, message: 'Booking status updated' });
      } else {
        res.status(404).json({ success: false, message: 'Booking not found' });
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async createBooking(req, res) {
    try {
      const id = await serviceRepository.createBooking(req.body);
      res.status(201).json({ success: true, id });
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}

module.exports = new ServiceController();
